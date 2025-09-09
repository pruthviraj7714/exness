import { WS_URL } from "@/lib/config";
import { useEffect, useState } from "react";

const useSocket = (asset?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      asset ? `${WS_URL}?asset=${asset}` : `${WS_URL}?mode=ALL`
    );

    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onerror = () => {
      setIsConnected(false);
      setSocket(null);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };

    return () => {
      setSocket(null);
      setIsConnected(false);
    };
  }, [asset]);

  return {
    socket,
    isConnected,
  };
};

export default useSocket;
