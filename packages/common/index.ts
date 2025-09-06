import z from "zod";

export const OrderSchema = z.object({
    asset : z.string(),
    type : z.enum(["LONG", "SHORT"], {error : "Invalid Type"}),
    margin : z.number(),
    leverage : z.number().min(1, {message : "Leverage should be at least 1"}).max(100, {error : "Leverage cannot be more than 100"}),
    slippage : z.number()
})

export const DecimalsMap: Record<string, number> = {
    USDC: 2,
    SOL: 6,
    BTC: 4,
    ETH : 2,
    USDT : 2
  };