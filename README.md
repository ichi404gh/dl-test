## Configuration
Create `.env` and fill variables:
```dotenv
DATABASE_URL: "postgres://localhost:5432/dl"
REDIS_URL: "redis://127.0.0.1:6379/0"
```
## Database
Apply database schema from `src/sql/schema.sql`, apply seeds from `src/sql/seeds/` directory,
## Running
```shell
npm install
npm run dev
```


## Endpoints

```http request
###
GET http://localhost:3000/items

###
POST http://localhost:3000/market/buy
Content-Type: application/json

{ 
    "userId": 1,
    "productId": 2
}
```