import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {name: String,category: String,price: Number,
  },
  {
    timestamps: true,
  },
);

productSchema.index({
  createdAt: -1,
  _id: -1,
});

export default mongoose.model("Product", productSchema);
