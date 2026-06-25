import express from "express";
import dotenv from "dotenv";

import productRoutes from "./routes/product.route.js";
import connectDB from "./db.js";

dotenv.config();

const app = express();

connectDB();

app.use(express.json());

app.use(productRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server running");
});
