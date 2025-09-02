import express from "express";
import cors from "cors";
import userRouter from "./routes/userRoutes";
import cookieParser from "cookie-parser";
import tradeRouter from "./routes/tradeRoutes";
import assetRouter from "./routes/assetRouer";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/trade", tradeRouter);
app.use("/api/v1/asset", assetRouter);

app.listen(3000, () => {
  console.log("server is running on port 3000");
});
