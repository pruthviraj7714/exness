import redisclient from "@repo/redisclient";
import {
  CONSUMER_NAME,
  ENGINE_STREAM,
  GROUP_NAME,
  RESULTS_STREAM,
} from "./config";
import fs from "fs";
import type { IEventData, IOrder, IPriceData } from "./types/types";

const prices: Record<string, IPriceData> = {};
const balances: Record<string, number> = {};
const openOrders: Record<string, IOrder[]> = {};

function parseStreamData(streams: any[]) {
  const results: any[] = [];
  for (const [, entries] of streams) {
    for (const [id, fields] of entries) {
      const obj: Record<string, string> = {};
      for (let i = 0; i < fields.length; i += 2) {
        obj[fields[i]] = fields[i + 1];
      }
      if (obj.data) {
        results.push({ streamId: id, ...JSON.parse(obj.data) });
      }
    }
  }
  return results;
}

const createConsumerGroup = async () => {
  try {
    await redisclient.xgroup(
      "CREATE",
      ENGINE_STREAM,
      GROUP_NAME,
      "0",
      "MKSTREAM"
    );
  } catch (error: any) {
    if (error.message.includes("BUSYGROUP")) {
      console.log(`Group with ${GROUP_NAME} already exists`);
    } else {
      console.error(error);
    }
  }
};

const saveSnapshot = () => {
  const currState = {
    timestamp: Date.now(),
    openOrders: openOrders,
    balances: balances,
    price: prices,
  };

  fs.appendFileSync("./snapshot.json", JSON.stringify(currState) + "\n");
};

const autoCloseOrder = async (order: IOrder) => {
  const assetPrice = prices[order.asset]!;

  let currentPrice =
    order.type === "LONG"
      ? assetPrice.bid / 10 ** assetPrice.decimal
      : assetPrice.ask / 10 ** assetPrice.decimal;

  const pnl =
    order.type === "LONG"
      ? (currentPrice - order.openPrice) * order.qty!
      : (order.openPrice - currentPrice) * order.qty!;

  order.pnl = pnl;

  let finalOrderData = {
    ...order,
    closePrice: currentPrice,
    event : "ORDER_CLOSED",
    closedAt : Date.now(),
    pnl,
  };

  console.log(finalOrderData);

  openOrders[order.userId] = openOrders[order.userId]?.filter((odr) => odr.id !== order.id) || [];
  balances[order.userId] = (balances[order.userId] || 0) + order.pnl;

  await redisclient.xack(ENGINE_STREAM, GROUP_NAME, order.streamId);
  await redisclient.xadd(
    RESULTS_STREAM,
    "*",
    "data",
    JSON.stringify(finalOrderData)
  );
};

const handleCalculatePNL = async (order: IOrder, currentPrices: IPriceData) => {
  let pnl: number;

  let openPrice = order.openPrice;
  let currentPrice =
    order.type === "LONG"
      ? currentPrices.bid / 10 ** currentPrices.decimal
      : currentPrices.ask / 10 ** currentPrices.decimal;

  pnl =
    order.type === "LONG"
      ? (currentPrice - openPrice) * order.qty!
      : (openPrice - currentPrice) * order.qty!;

  order.pnl = pnl;

  const equity = order.margin + pnl;

  if (equity <= order.margin * 0.1) {
    console.log("Order is closing due to low margin (liquidation)");
    await autoCloseOrder(order);
  }
};

const handlePriceUpdate = (latestPrices: Record<string, IPriceData>) => {
  Object.keys(openOrders).forEach((userId) => {
    openOrders[userId]?.forEach(
      async (order) =>
        await handleCalculatePNL(order, latestPrices[order.asset]!)
    );
  });
};

const processPlaceOrder = async (event: IEventData) => {
  try {
    if (event.event === "PLACE_ORDER") {
      const { asset, leverage, id, margin, slippage, type, userId } =
        event.data;
      balances[userId] = balances[userId] || 5000;

      openOrders[userId] = openOrders[userId] || [];

      const openPrice =
        type === "LONG"
          ? prices[asset]?.ask! / 10 ** prices[asset]?.decimal!
          : prices[asset]?.bid! / 10 ** prices[asset]?.decimal!;

      if (!openPrice) {
        console.log("open price not found!");
        return;
      }

      const quantity = (margin * leverage) / openPrice;

      let orderData: IOrder = {
        id: id,
        asset: asset,
        leverage: leverage,
        margin: margin,
        slippage: slippage,
        type: type,
        userId: userId,
        event : "ORDER_PLACED",
        openPrice,
        qty: quantity,
        streamId: event.streamId,
        opendAt : Date.now()
      };

      openOrders[event.data.userId]!.push(orderData);

      await redisclient.xack(ENGINE_STREAM, GROUP_NAME, event.streamId);

      await redisclient.xadd(
        RESULTS_STREAM,
        "*",
        "data",
        JSON.stringify(orderData)
      );
    }
  } catch (error) {
    console.error(
      "error while processing order: " + event.id + "err: " + error
    );
  }
};

const processCancelOrder = async (event: IEventData) => {
  try {
    if (event.event === "CANCEL_ORDER") {
      const { orderId, userId } = event.data;

      const order = openOrders[userId]?.find((order) => order.id === orderId);

      if (!order) {
        console.log("order not found!");
        return;
      }

      const assetPrice = prices[order.asset]!;

      let currentPrice =
        order.type === "LONG"
          ? assetPrice.bid / 10 ** assetPrice.decimal
          : assetPrice.ask / 10 ** assetPrice.decimal;

      const pnl =
        order.type === "LONG"
          ? (currentPrice - order.openPrice) * order.qty!
          : (order.openPrice - currentPrice) * order.qty!;

      order.pnl = pnl;

      let finalOrderData = {
        ...order,
        event : "ORDER_CLOSED",
        closedAt : Date.now(),
        closePrice: currentPrice,
        pnl,
      };

      console.log(finalOrderData);

      openOrders[userId] = openOrders[userId]?.filter((order) => order.id !== orderId) || [];
      balances[order.userId] = (balances[order.userId] || 0) + order.pnl;

      await redisclient.xack(ENGINE_STREAM, GROUP_NAME, event.streamId);
      await redisclient.xadd(
        RESULTS_STREAM,
        "*",
        "data",
        JSON.stringify(finalOrderData)
      );
    }
  } catch (error) {
    console.error(
      "error while processing order: " + event.id + "err: " + error
    );
  }
};

const processEvents = (events: IEventData[]) => {
  events.map(async (event) => {
    switch (event.event) {
      case "PLACE_ORDER": {
        await processPlaceOrder(event);
        break;
      }
      case "CANCEL_ORDER": {
        await processCancelOrder(event);
        break;
      }
      case "PRICE_UPDATE": {
        if (event.data) {
          Object.keys(event.data).forEach(
            (val: string) =>
              (prices[val] = {
                decimal: event.data[val]!.decimal,
                bid: event.data[val]!.bid,
                ask: event.data[val]!.ask,
              })
          );
        }
        handlePriceUpdate(prices);
        console.log(openOrders);
        
        await redisclient.xack(ENGINE_STREAM, GROUP_NAME, event.streamId);
        break;
      }
      default: {
        throw new Error("Unknown eventss");
      }
    }
  });
};

async function main() {
  await createConsumerGroup();

  const prevMessages = await redisclient.xreadgroup(
    "GROUP",
    GROUP_NAME,
    CONSUMER_NAME,
    "BLOCK",
    5000,
    "STREAMS",
    ENGINE_STREAM,
    "0"
  );

  if (prevMessages && prevMessages.length > 0) {
    const data = parseStreamData(prevMessages);
    processEvents(data);
  }

  while (true) {
    try {
      const newMessages = await redisclient.xreadgroup(
        "GROUP",
        GROUP_NAME,
        CONSUMER_NAME,
        "BLOCK",
        5000,
        "STREAMS",
        ENGINE_STREAM,
        ">"
      );

      if (newMessages && newMessages.length > 0) {
        const data = parseStreamData(newMessages);
        processEvents(data);
      }
    } catch (error) {
      console.error("Error in main loop: ", error);
    }
  }
}

main();
setInterval(saveSnapshot, 5000);
