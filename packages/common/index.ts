import z from "zod";

export const OrderSchema = z.object({
  asset: z.string(),
  type: z.enum(["LONG", "SHORT"], { error: "Invalid Type" }),
  margin: z.number(),
  leverage: z
    .number()
    .min(1, { message: "Leverage should be at least 1" })
    .max(100, { error: "Leverage cannot be more than 100" }),
  slippage: z.number(),
});

export const SUPPORTED_ASSETS = ["SOL", "ETH", "BTC"];

export const SUPPORTED_MARKETS = [
    {
      symbol: "BTCUSDT",
      name: "Bitcoin",
      asset: "BTC",
      logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
      color: "#F7931A",
    },
    {
      symbol: "ETHUSDT",
      asset: "ETH",
      name: "Ethereum",
      logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
      color: "#627EEA",
    },
    {
      symbol: "SOLUSDT",
      asset: "SOL",
      name: "Solana",
      logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
      color: "#9945FF",
    },
  ];
export const DecimalsMap: Record<string, number> = {
  USDC: 2,
  SOL: 6,
  BTC: 4,
  ETH: 2,
  USDT: 2,
};
