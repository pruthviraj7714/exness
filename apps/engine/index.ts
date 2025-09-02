import redisclient from "@repo/redisclient";

const subscriber = redisclient.duplicate();

subscriber.subscribe("PRICE_UPDATES", (err, count) => {
  if (err) {
    console.log(err.message);
  } else {
    console.log(`Subscribed`);
  }
});

interface IPriceData {
  price: number;
  decimal: number;
}

const prices: Record<string, IPriceData> = {};

async function main() {
  subscriber.on("message", (channel, message) => {
    const payload = JSON.parse(message.toString());

    Object.keys(payload).forEach((value: any) => {
      prices[value] = {
        price: payload[value].price,
        decimal: payload[value].decimal,
      };
    });

  });
}

main();
