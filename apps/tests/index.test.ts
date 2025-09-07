import request from "supertest";
import { expect, test, describe, beforeAll } from "bun:test";
import prisma from "@repo/db";
import jwt from "jsonwebtoken";
import { BACKEND_URL, EMAIL_JWT_SECRET } from "./config";
import { SUPPORTED_ASSETS } from "@repo/common";

function randomBetween(a: number, b: number): number {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

const generateRandomUserAndReturnCookie = async (): Promise<string> => {
  const randomEmail = Date.now().toString() + "@gmail.com";
  await request(BACKEND_URL).post(`/api/v1/user/signup`).send({
    email: randomEmail,
  });

  const token = jwt.sign(
    {
      email: randomEmail,
    },
    EMAIL_JWT_SECRET
  );

  const signInRes = await request(BACKEND_URL)
    .get(`/api/v1/user/signin/post?token=${token}`)
    .redirects(0);

  const cookie = signInRes.headers["set-cookie"]![0];

  if (!cookie) throw new Error("Cookie not found");

  return cookie;
};

const placeRandomOrder = async (cookie: string): Promise<string> => {
  const randomAsset =
    SUPPORTED_ASSETS[Math.floor(Math.random() * SUPPORTED_ASSETS.length)];
  const randomMargin = randomBetween(1, 1000);
  const randomLeverage = randomBetween(1, 100);
  const randomOrderType = ["LONG", "SHORT"][Math.floor(Math.random() * 2)];

  const res = await request(BACKEND_URL)
    .post("/api/v1/trade/create")
    .send({
      asset: randomAsset,
      type: randomOrderType,
      margin: randomMargin,
      leverage: randomLeverage,
      slippage: 10,
    })
    .set("Cookie", cookie);

  if (res.error) {
    throw Error("Error while placing order");
  }

  return res.body.result.id;
};

beforeAll(async () => {
  await prisma.position.deleteMany();
  await prisma.user.deleteMany();
});

describe("User Endpoints", () => {
  test("user signup - should fail if email not given", async () => {
    const res = await request(BACKEND_URL).post(`/api/v1/user/signup`).send({});
    expect(res.status).toBe(400);
  });
  test("user signup - should succeed if valid email is given", async () => {
    const res = await request(BACKEND_URL).post(`/api/v1/user/signup`).send({
      email: "test@gmail.com",
    });
    expect(res.status).toBe(200);
  });
  test("user signin - should fail if no email is given", async () => {
    const res = await request(BACKEND_URL).post(`/api/v1/user/signin`).send({});
    expect(res.status).toBe(400);
  });
  test("user signin - should failed if previously not registerd", async () => {
    const res = await request(BACKEND_URL).post(`/api/v1/user/signin`).send({
      email: "test1@gmail.com",
    });
    expect(res.status).toBe(400);
  });
  test("user signin - should succeed if valid email is given", async () => {
    await request(BACKEND_URL).post(`/api/v1/user/signup`).send({
      email: "test2@gmail.com",
    });
    const res = await request(BACKEND_URL).post(`/api/v1/user/signin`).send({
      email: "test2@gmail.com",
    });
    expect(res.status).toBe(200);
  });
  test("should signup, click link, set cookie, and redirect", async () => {
    const res = await request(BACKEND_URL).post(`/api/v1/user/signup`).send({
      email: "flowtest@gmail.com",
    });

    expect(res.status).toBe(200);

    const token = jwt.sign(
      {
        email: "flowtest@gmail.com",
      },
      EMAIL_JWT_SECRET
    );

    const res1 = await request(BACKEND_URL)
      .get(`/api/v1/user/signin/post?token=${token}`)
      .redirects(0);

    expect(res1.status).toBe(302);
    expect(res1.headers["set-cookie"]).toBeDefined();
    expect(res1.headers["location"]).toContain("/dashboard");
  });
});

describe("Trade Endpoints", () => {
  test("Trade create - should fail if no cookie passed", async () => {
    const res = await request(BACKEND_URL)
      .post(`/api/v1/trade/create`)
      .send({});
    expect(res.status).toBe(401);
  });
  test("Trade create - should fail if wrong cookie passed", async () => {
    const res = await request(BACKEND_URL)
      .post(`/api/v1/trade/create`)
      .set("Cookie", "rafn232")
      .send({});
    expect(res.status).toBe(401);
  });
  test("Trade create - should fail if no inputs given", async () => {
    const cookie = await generateRandomUserAndReturnCookie();
    const res = await request(BACKEND_URL)
      .post(`/api/v1/trade/create`)
      .set("Cookie", cookie)
      .send({});
    expect(res.status).toBe(400);
  });
  test("Trade create - should if wrong inputs given", async () => {
    const cookie = await generateRandomUserAndReturnCookie();
    const res = await request(BACKEND_URL)
      .post(`/api/v1/trade/create`)
      .set("Cookie", cookie)
      .send({
        asset: "SOL",
        type: "LOL",
        margin: "42",
        leverage: "32",
        slippage: "10000",
      });
    expect(res.status).toBe(400);
  });
  test("Trade create - should succeed if right inputs given", async () => {
    const cookie = await generateRandomUserAndReturnCookie();
    const res = await request(BACKEND_URL)
      .post(`/api/v1/trade/create`)
      .set("Cookie", cookie)
      .send({
        asset: "SOL",
        type: "LONG",
        margin: 100,
        leverage: 100,
        slippage: 1,
      });
    expect(res.status).toBe(200);
  });
  test("Trade close - should fail if no cookie passed", async () => {
    const res = await request(BACKEND_URL).post(`/api/v1/trade/close/wef2323f`);
    expect(res.status).toBe(401);
  });
  test("Trade close - should fail if wrong cookie passed", async () => {
    const res = await request(BACKEND_URL)
      .post(`/api/v1/trade/close/23e2d2`)
      .set("Cookie", "rafn232");
    expect(res.status).toBe(401);
  });
  test("Trade close - should fail if wrong orderId given", async () => {
    const cookie = await generateRandomUserAndReturnCookie();
    const res = await request(BACKEND_URL)
      .post(`/api/v1/trade/close/23e4212`)
      .set("Cookie", cookie);
    expect(res.status).toBe(400);
  });
  test("Trade close - should succeed if valid orderId given", async () => {
    const cookie = await generateRandomUserAndReturnCookie();
    const orderId = await placeRandomOrder(cookie);
    const res = await request(BACKEND_URL)
      .post(`/api/v1/trade/close/${orderId}`)
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
  });
});

describe("Positions Endpoints", () => {
  test("fetch open positions - should fail if no cookie passed", async () => {
    const res = await request(BACKEND_URL).get(`/api/v1/positions/open`);
    expect(res.status).toBe(401);
  });
  test("fetch open positions - should fail if wrong cookie passed", async () => {
    const res = await request(BACKEND_URL)
      .get(`/api/v1/positions/open`)
      .set("Cookie", "rafn232");
    expect(res.status).toBe(401);
  });
  test("fetch open positions - should succeed if right cookie given", async () => {
    const cookie = await generateRandomUserAndReturnCookie();
    const res = await request(BACKEND_URL)
      .get(`/api/v1/positions/open`)
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toBeArray();
  });
  test("fetch closed positions - should fail if no cookie passed", async () => {
    const res = await request(BACKEND_URL).get(`/api/v1/positions/closed`);
    expect(res.status).toBe(401);
  });
  test("fetch closed positions - should fail if wrong cookie passed", async () => {
    const res = await request(BACKEND_URL)
      .get(`/api/v1/positions/closed`)
      .set("Cookie", "rafn232");
    expect(res.status).toBe(401);
  });
  test("fetch closed positions - should succeed if right cookie given", async () => {
    const cookie = await generateRandomUserAndReturnCookie();
    const res = await request(BACKEND_URL)
      .get(`/api/v1/positions/closed`)
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body).toBeArray();
  });
});
