import {serve} from '@hono/node-server'
import {Hono} from 'hono'

import {route as market} from "./routes/market.js"
import {route as items} from "./routes/items.js"

const app = new Hono()


app.route("/items", items)
app.route("/market", market)



serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
