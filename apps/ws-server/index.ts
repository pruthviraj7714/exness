import { WebSocketServer, WebSocket } from "ws";
import redisclient from "@repo/redisclient";

interface IPriceData {
  bid: number;
  ask: number;
  decimal: number;
  asset: string;
}

const latestPrices: Record<string, IPriceData> = {};
const subscribedClients: Record<string, WebSocket[]> = {};

const wss = new WebSocketServer({ port: 8080 });

const subscriber = redisclient.duplicate();

subscriber.subscribe("LATEST_PRICES", (err) => {
  if (err) console.error(err);
});

subscriber.on("message", (_channel, message) => {
  const data = JSON.parse(message);

  for (const asset in data) {
    latestPrices[asset] = data[asset];
    sendSpecificMarketsToClients(asset);
  }

  sendAllMarketsToClients();
});

function sendAllMarketsToClients() {
  subscribedClients["ALL"] = (subscribedClients["ALL"] || []).filter(
    (client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "ALL_PRICES",
            data: latestPrices,
          })
        );
        return true;
      }
      return false;
    }
  );
}

function sendSpecificMarketsToClients(asset: string) {
  subscribedClients[asset] = (subscribedClients[asset] || []).filter(
    (client) => {
      if (client.readyState === WebSocket.OPEN && latestPrices[asset]) {
        client.send(
          JSON.stringify({
            type: "ASSET_PRICES",
            data: latestPrices[asset],
          })
        );
        return true;
      }
      return false;
    }
  );
}

wss.on("connection", (ws, req) => {
  const params = new URLSearchParams(req.url?.split("?")[1] || "");
  const asset = params.get("asset");
  const mode = params.get("mode");

  if (mode === "ALL") {
    if (!subscribedClients["ALL"]) subscribedClients["ALL"] = [];
    subscribedClients["ALL"].push(ws);
  } else if (asset) {
    if (!subscribedClients[asset]) subscribedClients[asset] = [];
    subscribedClients[asset].push(ws);
  } else {
    ws.send(JSON.stringify({ type: "ERROR", message: "Invalid subscription" }));
    ws.close();
    return;
  }

  ws.on("close", () => {
    console.log("WS connection closed!");
  });

  ws.on("error", (err) => {
    console.error(err.message);
  });
});
