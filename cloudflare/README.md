Cloudflare migration notes for this project.

1. Create a D1 database and an R2 bucket.
2. Put the real `database_id` and `bucket_name` into `wrangler.toml`.
3. Apply schema:
   `npx wrangler d1 execute electricpmr --local --file=cloudflare/schema.sql`
4. Run the Worker:
   `npx wrangler dev`
5. Run the frontend:
   `npm run dev`

Optional env vars for webhooks and bootstrap:
- `SUPER_ADMIN_EMAIL`
- `REQUEST_EMAIL_WEBHOOK_URL`
- `REQUEST_EMAIL_WEBHOOK_TOKEN`
- `ESTIMATE_EMAIL_WEBHOOK_URL`
- `ESTIMATE_EMAIL_WEBHOOK_TOKEN`
