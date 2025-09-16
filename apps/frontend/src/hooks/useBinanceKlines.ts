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
      
      if (updated.length > 0 && updated[lastIndex]?.time === newCandle.time) {
        updated[lastIndex] = newCandle;
      } 
      else if (isComplete) {
        updated.push(newCandle);
        
        if (updated.length > 1000) {
          updated.splice(0, updated.length - 1000);
        }
      }
      else if (updated.length === 0 || newCandle.time > updated[lastIndex]?.time) {
        updated.push(newCandle);
      }

      return updated;
    });
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component cleanup'); 
      wsRef.current = null;
    }
    
    reconnectAttemptsRef.current = 0;
    updateConnectionStatus('Disconnected');
  }, [updateConnectionStatus]);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'Reconnecting');
    }

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
      }, 10000); 

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        
        if (!isMountedRef.current) {
          ws.close();
          return;
        }

        console.log(`Connected to Binance stream: ${streamName}`);
        updateConnectionStatus('Connected');
        
        reconnectAttemptsRef.current = 0;
        
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

            if (isNaN(newCandle.open) || isNaN(newCandle.high) || isNaN(newCandle.low) || isNaN(newCandle.close)) {
              console.warn('Invalid price data in kline:', kline);
              return;
            }

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
        
        if (event.code !== 1000 && isMountedRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          
          const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current - 1); 
          
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

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    setTimeout(() => {
      if (isMountedRef.current) {
        connect();
      }
    }, 1000);
  }, [connect, disconnect]);

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