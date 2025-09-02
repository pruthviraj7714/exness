import redisclient from "@repo/redisclient";

const publisher = redisclient.duplicate();

interface IPriceData {
  asset: string;
  price: number;
  decimal: number;
}

const DecimalsMap: Record<string, number> = {
  USDC: 2,
  SOL: 6,
  BTC: 4,
  ETH : 2
};

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

    if (!payload.data.a || !payload.data.s) return;

    const asset = payload.data.s.split("_")[0];
    const symbolDecimals = DecimalsMap[asset]!;

    marketFeed[asset] = {
      price: parseFloat(payload.data.a) * 10 ** symbolDecimals,
      decimal: symbolDecimals,
      asset,
    };

    setInterval(async () => {
        await publisher.publish("PRICE_UPDATES", JSON.stringify(marketFeed));
        console.log('published:', marketFeed);
    }, 100);
  };
}

main();
