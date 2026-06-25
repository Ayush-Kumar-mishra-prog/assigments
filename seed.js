import dotenv from "dotenv";
import connectDB from "./db.js";
import Products from "./models/Products.js";

dotenv.config();
await connectDB();

const batch = 5000;

for (let i = 0; i < 200000; i += batch) {
  const docs = Array.from(
    {
      length: batch,
    },
    (_, j) => ({
      name: `Product ${i + j}`,

      category: ["tech", "book", "fashion"][Math.floor(Math.random() * 3)],

      price: Math.floor(Math.random() * 10000),
    }),
  );

  await Products.insertMany(docs);

  console.log(`${i + batch}`);
}

process.exit();
