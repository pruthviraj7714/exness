import redisclient from "@repo/redisclient";
import { DecimalsMap } from "@repo/common";
import { ENGINE_STREAM } from "./config";

interface IPriceData {
  asset: string;
  bid: number;
  ask: number;
  decimal: number;
}

const marketFeed: Record<string, IPriceData> = {};

async function main() {
  const ws = new WebSocket(`wss://ws.backpack.exchange`);

  ws.onopen = () => {
    console.log("connected with backpack");
    ws.send(
      JSON.stringify({
        id: 1,
        method: "SUBSCRIBE",
        params: [
          "bookTicker.SOL_USDC",
          "bookTicker.ETH_USDC",
          "bookTicker.BTC_USDC",
        ],
      })
    );
  };

  ws.onmessage = ({ data }) => {
    const payload = JSON.parse(data.toString());

    if (!payload.data.a || !payload.data.b || !payload.data.s) return;

    const asset = payload.data.s.split("_")[0];
    const symbolDecimals = DecimalsMap[asset]!;

    marketFeed[asset] = {
      bid : parseFloat(payload.data.a) * 10 ** symbolDecimals,
      ask : parseFloat(payload.data.b) * 10 ** symbolDecimals,
      decimal: symbolDecimals,
      asset,
    };
  };
}

setInterval(async () => {
  const priceUpdateToEngin = {
    event: "PRICE_UPDATE",
    data: marketFeed,
  };
  
  await redisclient.xadd(
    ENGINE_STREAM,
    "MAXLEN",
    "~",
    1000,
    "*",
    "data",
    JSON.stringify(priceUpdateToEngin),
  );
  console.log("sent to stream:", marketFeed);
}, 100);

main();
