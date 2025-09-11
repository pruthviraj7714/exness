import { UTCTimestamp } from 'lightweight-charts';
import { useRef, useEffect, useState } from 'react';

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
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    setConnectionStatus('connecting');
    const streamName = `${asset.toLowerCase()}usdt@kline_${interval}`;
    const wsUrl = `wss://stream.binance.com:9443/ws/${streamName}`;
    
    console.log(`Connecting to Binance WebSocket: ${streamName}`);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to Binance stream: ${streamName}`);
      setConnectionStatus('connected');
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.e === 'kline') {
          const kline = message.k;
          const newCandle: Candle = {
            time: Math.floor(kline.t / 1000) as UTCTimestamp,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
          };

          setCandleData(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            
            if (updated[lastIndex]?.time === newCandle.time) {
              updated[lastIndex] = newCandle;
            } else if (kline.x) { 
              updated.push(newCandle);
              
              if (updated.length > 1000) {
                updated.splice(0, updated.length - 1000);
              }
            }

            return updated;
          });
        }
      } catch (error) {
        console.error('Error parsing Binance WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log(`Binance WebSocket closed: ${event.code} ${event.reason}`);
      setConnectionStatus('disconnected');
      
      if (event.code !== 1000) { 
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect to Binance WebSocket...');
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('Binance WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000); 
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [asset, interval]);

  return {
    candleData,
    connectionStatus,
    connect,
    disconnect
  };
};

export default useBinanceKlines;