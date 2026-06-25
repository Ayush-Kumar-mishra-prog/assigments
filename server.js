import express from "express";
import dotenv from "dotenv";

import productRoutes from "./routes/product.route.js";
import connectDB from "./db.js";

dotenv.config();

const app = express();

connectDB();

app.use(express.json());

app.get('/',(req,res)=>{
    res.send("type: /products for see the all products and type this for apply filters /products?category=book, type this to move to the next index /products?cursor=currentCursorPointer")
})

app.use(productRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server running");
});
