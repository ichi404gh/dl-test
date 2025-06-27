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

    const balance = await sql.begin(async sql => {
      const user = await sql`
          SELECT *
          FROM users
          WHERE id = ${userId}
      `.then(rows => rows[0]);

      if (!user) {
        throw new HTTPException(404, {res: c.json({error: "User not found"})})
      }

      const userBalance = Number.parseFloat(user.balance);

      const product = await sql`
          SELECT price
          FROM products
          WHERE id = ${productId}
      `.then(rows => rows[0]);

      if (!product) {
        throw new HTTPException(404, {res: c.json({error: "Product not found"})});
      }

      const price = Number.parseFloat(product.price);

      if(price > userBalance) {
        throw new HTTPException(400, {res: c.json({error: "Insufficient balance"})});
      }

      const [{balance}] = await sql`
          UPDATE users
          SET balance = balance - ${product.price}
          WHERE id = ${userId}
          RETURNING balance
      `.catch(err => {
        throw new HTTPException(400, {res: c.json({error: "Insufficient balance"})});
      });

      await sql`
          INSERT INTO purchases (user_id, product_id, price)
          VALUES (${userId}, ${productId}, ${product.price})
      `;

      return balance;
    });

    return c.json({balance});
  });

