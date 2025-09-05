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
      "$",
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

const processPlaceOrder = async (event: IEventData) => {
  try {
    if (event.event === "PLACE_ORDER") {
      balances[event.data.userId] = balances[event.data.userId] || 5000;

      openOrders[event.data.userId] = openOrders[event.data.userId] || [];

      let orderData: IOrder = {
        asset: event.data.asset,
        leverage: event.data.leverage,
        margin: event.data.margin,
        slippage: event.data.slippage,
        type: event.data.type,
        userId: event.data.userId,
        id: event.data.id,
      };

      openOrders[event.data.userId]!.push(orderData);
      await redisclient.xadd(
        RESULTS_STREAM,
        "*",
        "data",
        JSON.stringify(orderData)
      );

      console.log(balances);
      console.log(openOrders);
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
                price: event.data[val]!.price,
              })
          );
        }
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
