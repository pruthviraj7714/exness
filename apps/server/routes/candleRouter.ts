import { Router } from "express";
import axios from "axios";
import authMiddleware from "../middleware/authMiddleware";

const klinesRouter = Router();

klinesRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const { asset, interval, startTime, endTime, limit } = req.query;

    if (!asset || !interval) {
      return res.status(400).json({ message: "Asset and interval are required query params" });
    }

    const params: Record<string, any> = {
      symbol: `${asset}USDT`,
      interval,
    };

    if (startTime) params.startTime = Number(startTime);
    if (endTime) params.endTime = Number(endTime);
    if (limit) params.limit = Number(limit);

    const { data } = await axios.get("https://api.binance.com/api/v3/klines", { params });

    if (!Array.isArray(data)) {
      return res.status(502).json({ message: "Invalid response from Binance" });
    }

    const candles = data.map(c => ({
      openTime: c[0],
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5],
      closeTime: c[6],
    }));

    return res.json(candles);
  } catch (error: any) {
    console.error("Error fetching klines:", error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

export default klinesRouter;
