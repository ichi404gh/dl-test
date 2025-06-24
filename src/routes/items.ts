import {Hono} from "hono";
import assert from "node:assert";

import redis from "../cache.js";

export const route = new Hono();

const KEY_TRADABLE = "data_tradable";
const KEY_NON_TRADABLE = "data_non_tradable";


async function getAndStoreData(tradable: boolean = false) {
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

  const data = await response.json();
  redis.set(tradable ? KEY_TRADABLE : KEY_NON_TRADABLE, JSON.stringify(data));
  return data;
}


route.get('/', async (c) => {
  const dataTradable: any[] = JSON.parse(await redis.get(KEY_TRADABLE) ?? "null") ?? await getAndStoreData(true);
  const dataNonTradable: any[] = JSON.parse(await redis.get(KEY_NON_TRADABLE) ?? "null") ?? await getAndStoreData(false);


  const res = [];
  for (let i = 0; i < dataTradable.length; i++) {
    assert(dataTradable[i].market_hash_name === dataNonTradable[i].market_hash_name, "wrong pair of items");

    const data: Record<string, any> = {};
    data['market_hash_name'] = dataTradable[i].market_hash_name;
    data['currency'] = dataTradable[i].currency;
    data['min_price_tradable'] = dataTradable[i].min_price;
    data['min_price_non_tradable'] = dataNonTradable[i].min_price;
    res.push(data);
  }

  return c.json(res);
});
