import {Hono} from "hono";
import {HTTPException} from "hono/http-exception";
import {zValidator} from '@hono/zod-validator'
import {z} from 'zod'

import sql from "../db.js"


export const route = new Hono()

const buyParamsSchema = z.object({
  userId: z.number(),
  productId: z.number(),
})

route.post(
  "/buy",
  zValidator("json", buyParamsSchema),
  async (c) => {
    const {userId, productId} = c.req.valid("json");

    const user = await sql`
        SELECT id
        FROM users
        WHERE id = ${userId}`;

    if (user.length === 0) {
      throw new HTTPException(404, {res: c.json({error: "User not found"})})
    }

    const priceResult = await sql`
        SELECT price
        FROM products
        WHERE id = ${productId}`;

    if (!priceResult.count) {
      throw new HTTPException(404, {res: c.json({error: "Product not found"})});
    }

    const price = priceResult[0].price;
    const updateResult = await sql`
        UPDATE users
        SET balance = balance - ${price}
        WHERE id = ${userId}
          AND balance >= ${price}
        RETURNING balance
    `;

    if (!updateResult.count) {
      throw new HTTPException(400, {res: c.json({error: "Insufficient balance"})});
    }

    await sql`
        INSERT INTO purchases (user_id, product_id, price)
        VALUES (${userId}, ${productId}, ${price})
    `;

    return c.json(updateResult[0]);

  });

