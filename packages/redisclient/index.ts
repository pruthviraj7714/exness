import Redis from "ioredis"

const redisclient = new Redis(process.env.REDIS_URL!);

export default redisclient;