import postgres from 'postgres'
import assert from "node:assert";
import dotenv from 'dotenv';

dotenv.config()

assert(!!process.env.DATABASE_URL, "DATABASE_URL is required");

const sql = postgres(process.env.DATABASE_URL);

export default sql;
