import {Hono} from "hono";
import assert from "node:assert";

import redis from "../cache.js";
import {z} from "zod";

export const route = new Hono();

const KEY_TRADABLE = "data_tradable";
const KEY_NON_TRADABLE = "data_non_tradable";

const itemSchema = z.object({
  market_hash_name: z.string(),
  currency: z.string(),
  min_price: z.number().nullable(),
});

const itemsResponseSchema = z.array(itemSchema);

type Item = z.infer<typeof itemSchema>;

type ItemOutputModel = {
  market_hash_name: String;
  currency: String;
  min_price_tradable: number | null;
  min_price_non_tradable: number | null;
}

async function getAndStoreData(tradable: boolean) {
  const params = new URLSearchParams({
    app_id: "730",
    currency: 'EUR',
    tradable: tradable ? "1" : "0"
  });

  const response = await fetch(`https://api.skinport.com/v1/items?${params}`, {
    method: 'GET',
    headers: {
      'Accept-Encoding': 'br'
    }
  });

  const rawData = await response.json();
  const data = itemsResponseSchema.parse(rawData);
  await redis.set(tradable ? KEY_TRADABLE : KEY_NON_TRADABLE, JSON.stringify(data));
  return data;
}

async function getDataFromCache(tradable: boolean): Promise<Item[]> {
  return JSON.parse(await redis.get(tradable ? KEY_TRADABLE : KEY_NON_TRADABLE) ?? "null") ?? [] as Item[];
}

async function getItems(tradable: boolean): Promise<Item[]> {
  const data = await getDataFromCache(tradable);
  if (data.length > 0) {
    return data;
  }
  return await getAndStoreData(tradable);
}

route.get('/', async (c) => {
  const [dataTradable, dataNonTradable] = await Promise.all([getItems(true), getItems(false)]);

  const res: ItemOutputModel[] = [];
  for (let i = 0; i < dataTradable.length; i++) {
    assert(dataTradable[i].market_hash_name === dataNonTradable[i].market_hash_name, "wrong pair of items");

    const data: ItemOutputModel = {
      market_hash_name: dataTradable[i].market_hash_name,
      currency: dataTradable[i].currency,
      min_price_tradable: dataTradable[i].min_price,
      min_price_non_tradable: dataNonTradable[i].min_price,
    };

    res.push(data);
  }

  return c.json(res);
});
