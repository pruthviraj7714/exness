import redisclient from "@repo/redisclient";
import { CONSUMER_NAME, GROUP_NAME, RESULTS_STREAM } from "./config";
import type {
  ICloseOrderEvent,
  IPlaceOrderEvent,
  OrderEvent,
} from "./types/types";
import prisma from "@repo/db";

const createConsumerGroup = async () => {
  try {
    await redisclient.xgroup(
      "CREATE",
      RESULTS_STREAM,
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

const handleInsertPlacedOrder = async (event: IPlaceOrderEvent) => {
  try {
    if (event.type !== "ERROR") {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: {
            id: event.userId,
          },
          data: {
            usdBalance: {
              decrement: event.margin,
            },
          },
        });
        if (event.type === "ERROR") return;
        await tx.position.create({
          data: {
            id: event.id,
            asset: event.asset,
            margin: event.margin,
            leverage: event.leverage,
            openPrice: event.openPrice,
            qty: event.qty,
            slippage: event.slippage,
            type: event.type,
            userId: event.userId,
            openedAt: new Date(event.openedAt),
          },
        });
      });
      await redisclient.xack(RESULTS_STREAM, GROUP_NAME, event.streamId);
      console.log(
        "Order with orderId " + event.id + " successfully inserted into db"
      );
    }
  } catch (error) {
    console.error("Error while inserting in db: ", error);
  }
};

const handleInsertClosedOrder = async (event: ICloseOrderEvent) => {
  try {
    if (event.type !== "ERROR") {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: {
            id: event.userId,
          },
          data: {
            usdBalance: event.finalBalance,
          },
        });
        await tx.position.update({
          where: {
            id: event.id,
          },
          data: {
            userId: event.userId,
            closedAt: new Date(event.closedAt),
            pnl: event.pnl,
            closePrice: event.closePrice,
            status: "CLOSE",
          },
        });
      });
      await redisclient.xack(RESULTS_STREAM, GROUP_NAME, event.streamId);
      console.log(
        "Order with orderId " + event.id + " successfully inserted into db"
      );
    }
  } catch (error) {
    console.error("Error while inserting in db: ", error);
  }
};

const handleProcessEvents = (events: OrderEvent[]) => {
  events.forEach(async (event) => {
    switch (event.event) {
      case "ORDER_PLACED": {
        await handleInsertPlacedOrder(event);
        break;
      }
      case "ORDER_CLOSED": {
        await handleInsertClosedOrder(event);
        break;
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
    "STREAMS",
    RESULTS_STREAM,
    "0"
  );

  if (prevMessages && prevMessages.length > 0) {
    const data = parseStreamData(prevMessages);
    handleProcessEvents(data);
  }

  while (true) {
    const newMessages = await redisclient.xreadgroup(
      "GROUP",
      GROUP_NAME,
      CONSUMER_NAME,
      "BLOCK",
      5000,
      "STREAMS",
      RESULTS_STREAM,
      ">"
    );

    if (newMessages && newMessages.length > 0) {
      const data = parseStreamData(newMessages);
      handleProcessEvents(data);
    }
  }
}

main();
