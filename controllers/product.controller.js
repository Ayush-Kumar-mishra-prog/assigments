import Products from "../models/Products.js";


export const getProducts = async (req, res) => {
  const { category, cursor } = req.query;

  const limit = parseInt(req.query.limit) || 20;
  if (limit > 100) limit = 100;   // cap so nobody overloads the server
  if (limit < 1) limit = 20;

  const query = {};

  if (category) {
    query.category = category;
  }

  if (cursor) {
    query._id = {
      $lt: cursor,
    };
  }

  const data = await Products.find(query)

    .sort({
      createdAt: -1,
      _id: -1,
    })

    .limit(limit);

  res.json({
    count: data.length,

    nextCursor: data.length ? data[data.length - 1]._id : null,

    data,
  });
};
