# Assignment— Products API

A backend that serves ~200,000 products, newest-first, with category
filtering and fast, correct pagination — even while new products are
being added or updated concurrently.

- **Live API:** https://assigments-2c8j.onrender.com
- **Repo:** https://github.com/Ayush-Kumar-mishra-prog/assigments

## Stack

- **Node.js + Express** — backend framework
- **MongoDB** — database
- **Mongoose** (or native MongoDB driver — *update this line to match
  what you actually used*)

## Why this stack

I chose Node/Express for a quick, focused API. I chose MongoDB because
this data is a single flat collection with no relations — no joins, no
foreign keys — so a document store fits naturally without the overhead
of defining a relational schema. I'm also more comfortable iterating
quickly in MongoDB for a project this size.

## The two real problems this task is testing

### 1. Fast pagination at 200k documents

A naive "skip N, take 20" approach (`.skip(N).limit(20)` in MongoDB)
still has to walk past and discard the first N matching documents on
every request — so a deep page is dramatically slower than page 1.

This API uses **keyset (cursor) pagination** instead: each response
includes a `next_cursor`, an opaque token encoding the `created_at` and
`_id` of the last document returned. The next request passes that
cursor back, and the query becomes:

```js
{
  $or: [
    { created_at: { $lt: cursor.created_at } },
    { created_at: cursor.created_at, _id: { $lt: cursor._id } }
  ]
}
```
sorted by `{ created_at: -1, _id: -1 }`, with `.limit(20)`.

With a compound index on `{ created_at: -1, _id: -1 }`, MongoDB can walk
this directly using the index — starting exactly at the right point
rather than scanning from the top — so performance stays consistent
regardless of how deep into the result set the cursor is.

### 2. Correctness while data is changing

If pagination is based on *position* (skip/limit), inserting new
documents at the top while someone is browsing shifts every document's
position down by one — so the next "page" either repeats a document or
skips one entirely.

Keyset pagination identifies the next page by *value*, not position:
"documents older than this exact `(created_at, _id)` point." New
inserts at the top don't change where that point sits in the sort
order, so no duplicates and no skipped documents occur, no matter how
many writes happen concurrently while a user pages through.

The tie-break on `_id` (not just `created_at`) matters because many
seeded products intentionally share the same timestamp — without a
tie-breaker, documents with identical `created_at` could be skipped or
repeated across a page boundary.

## Data model

Each product document:
```json
{
  "_id": "ObjectId(...)",
  "name": "Wireless Mouse 4521",
  "category": "Electronics",
  "price": 1299.00,
  "created_at": "2026-05-01T10:23:11.000Z",
  "updated_at": "2026-05-01T10:23:11.000Z"
}
```

**Indexes:**
- `{ created_at: -1, _id: -1 }` — powers plain newest-first pagination
- `{ category: 1, created_at: -1, _id: -1 }` — powers category-filtered
  + newest-first pagination in a single index scan

## API

### `GET /products`

| Query param | Required | Default | Notes |
|---|---|---|---|
| `category` | no | — | exact match filter |
| `limit` | no | 20 | capped at 100 |
| `cursor` | no | — | from previous response's `next_cursor`; omit for page 1 |

**Examples:**
```
GET /products?limit=20
GET /products?category=Electronics&limit=20
GET /products?category=Electronics&limit=20&cursor=<next_cursor_from_previous_response>
```

`next_cursor` is `null` on the last page.

## Setup

1. **Create a free MongoDB database** (e.g. MongoDB Atlas free tier).
   Get the connection URI.

2. **Clone and install:**
   ```bash
   git clone https://github.com/Ayush-Kumar-mishra-prog/assigments
   cd assigments
   npm install
   ```

3. **Configure environment:** create a `.env` file with your
   `MONGODB_URI`.

4. **Seed 200,000 products:**
   ```bash
   npm run seed
   ```
   This generates and batch-inserts products (e.g. via `insertMany` in
   chunks) rather than inserting one document at a time, so it finishes
   in well under a minute instead of taking many minutes.

5. **Run the server:**
   ```bash
   npm start
   ```
   Visit `http://localhost:3000/products?limit=20`.

## Deployment

- **Backend:** Render (free tier) — https://assigments-2c8j.onrender.com
- **Database:** MongoDB Atlas (free tier)

## What I'd improve with more time

- Add an integration test that seeds a small batch, inserts more
  documents mid-pagination, and asserts no duplicate/missing IDs across
  pages — to verify the "correctness under concurrent writes"
  requirement automatically rather than by manual testing.
- Confirm via `.explain()` that MongoDB is actually using the compound
  index for both the plain and category-filtered pagination queries,
  rather than falling back to a collection scan.
- Add a `total_count` (approximate, since keyset pagination alone
  doesn't give clients an easy way to show "X of Y results").
- Basic rate-limiting on the public endpoint.

## How I used AI

I used Claude to think through the two core design problems (fast
pagination at scale, and correctness under concurrent writes) and to
help write boilerplate. I made the final calls on stack (Node + MongoDB)
and tested the API manually — confirming `limit`, `category`, and
`cursor` query parameters all work as expected, including paging
forward across multiple requests without duplicate or missing
products.
