import { UTCTimestamp } from 'lightweight-charts';
import { useRef, useEffect, useState, useCallback } from 'react';

type Candle = {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    trades?: number;
};

const useBinanceKlines = (asset: string, interval: string) => {
  const [candleData, setCandleData] = useState<Candle[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'Disconnected' | 'Connecting' | 'Connected'>('Disconnected');

  // Maximum reconnection attempts before giving up
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  const updateConnectionStatus = useCallback((status: 'Disconnected' | 'Connecting' | 'Connected') => {
    if (isMountedRef.current) {
      setConnectionStatus(status);
    }
  }, []);

  const updateCandleData = useCallback((newCandle: Candle, isComplete: boolean) => {
    if (!isMountedRef.current) return;

    setCandleData(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      
      // If we have existing data and the times match, update the last candle
      if (updated.length > 0 && updated[lastIndex]?.time === newCandle.time) {
        updated[lastIndex] = newCandle;
      } 
      // If the candle is complete (kline.x is true), add it as a new candle
      else if (isComplete) {
        updated.push(newCandle);
        
        // Keep only the last 1000 candles to prevent memory issues
        if (updated.length > 1000) {
          updated.splice(0, updated.length - 1000);
        }
      }
      // For incomplete candles, still update if it's newer than the last candle
      else if (updated.length === 0 || newCandle.time > updated[lastIndex]?.time) {
        updated.push(newCandle);
      }

      return updated;
    });
  }, []);

  const disconnect = useCallback(() => {
    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component cleanup'); 
      wsRef.current = null;
    }
    
    // Reset reconnection attempts
    reconnectAttemptsRef.current = 0;
    updateConnectionStatus('Disconnected');
  }, [updateConnectionStatus]);

  const connect = useCallback(() => {
    // Don't connect if component is unmounted
    if (!isMountedRef.current) return;

    // Close existing connection if any
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'Reconnecting');
    }

    // Check if we've exceeded max reconnection attempts
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached for Binance WebSocket');
      updateConnectionStatus('Disconnected');
      return;
    }

    updateConnectionStatus('Connecting');
    
    const streamName = `${asset.toLowerCase()}usdt@kline_${interval}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;
    
    console.log(`Connecting to Binance WebSocket: ${streamName} (attempt ${reconnectAttemptsRef.current + 1})`);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error('WebSocket connection timeout');
          ws.close();
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        
        if (!isMountedRef.current) {
          ws.close();
          return;
        }

        console.log(`Connected to Binance stream: ${streamName}`);
        updateConnectionStatus('Connected');
        
        // Reset reconnection attempts on successful connection
        reconnectAttemptsRef.current = 0;
        
        // Clear any pending reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const message = JSON.parse(event.data);
          
          if (message.e === 'kline') {
            const kline = message.k;
            
            // Validate required kline data
            if (!kline || typeof kline.t !== 'number' || !kline.o || !kline.h || !kline.l || !kline.c) {
              console.warn('Invalid kline data received:', kline);
              return;
            }

            const newCandle: Candle = {
              time: Math.floor(kline.t / 1000) as UTCTimestamp,
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
            };

            // Validate parsed numbers
            if (isNaN(newCandle.open) || isNaN(newCandle.high) || isNaN(newCandle.low) || isNaN(newCandle.close)) {
              console.warn('Invalid price data in kline:', kline);
              return;
            }

            // kline.x indicates if the kline is closed (complete)
            const isComplete = Boolean(kline.x);
            updateCandleData(newCandle, isComplete);
          }
        } catch (error) {
          console.error('Error parsing Binance WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        
        if (!isMountedRef.current) return;

        console.log(`Binance WebSocket closed: ${event.code} ${event.reason}`);
        updateConnectionStatus('Disconnected');
        
        // Only attempt to reconnect if it wasn't a clean close and component is still mounted
        if (event.code !== 1000 && isMountedRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          
          const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current - 1); // Exponential backoff
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, delay);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        
        if (!isMountedRef.current) return;

        console.error('Binance WebSocket error:', error);
        updateConnectionStatus('Disconnected');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      updateConnectionStatus('Disconnected');
      
      // Attempt reconnection after a delay if component is still mounted
      if (isMountedRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, RECONNECT_DELAY);
      }
    }
  }, [asset, interval, updateConnectionStatus, updateCandleData]);

  // Manual reconnect function (resets attempt counter)
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    setTimeout(() => {
      if (isMountedRef.current) {
        connect();
      }
    }, 1000);
  }, [connect, disconnect]);

  // Clear candle data when asset or interval changes
  const clearData = useCallback(() => {
    if (isMountedRef.current) {
      setCandleData([]);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    clearData();
    
    connect();
    
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [asset, interval, connect, disconnect, clearData]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    candleData,
    connectionStatus,
    connect,
    disconnect,
    reconnect,
    isConnected: connectionStatus === 'Connected',
    reconnectAttempts: reconnectAttemptsRef.current
  };
};

export default useBinanceKlines;