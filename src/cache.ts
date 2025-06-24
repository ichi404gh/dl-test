import { Redis } from "ioredis";
import assert from "node:assert";
import dotenv from 'dotenv';

dotenv.config()

assert(!!process.env.REDIS_URL, "REDIS_URL is required");

const redis = new Redis(process.env.REDIS_URL);

export default redis;
