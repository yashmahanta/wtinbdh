# BSc Math Exam Assistant — 3-model gateway edition

This is the original Vite + React Math Assistant with **one functional change**: choose Gemini 2.5 Flash, Claude Sonnet 4.5, or DeepSeek V4 (Flash) from the existing page. Image upload/cropping, marks, LaTeX generation, and Overleaf export remain unchanged.

## Configuration

1. `npm install`
2. `cp .env.example .env.local`
3. Set `AI_GATEWAY_URL` and `AI_GATEWAY_API_KEY` in `.env.local` to your **existing self-hosted OpenAI-compatible API gateway**. For this OmniRoute instance, the public base URL is `https://omnirote67hb7b78g.duckdns.org/v1`; use the base URL ending in `/v1`, **not** the `/chat/completions` URL.
4. The restricted key is configured for the three IDs already listed in `.env.example`. Open `GET <your gateway URL>/models` using your gateway key if you need to verify them or change the allowlist later.
5. Run `npm run dev`. The model selector checks `GET /api/generate` (which queries your gateway model list) and submitting the question makes `POST /api/generate` forward a request to the selected model.

Example of checking the catalog **on the server** (without printing your secret):

```bash
curl -sS -H "Authorization: Bearer $AI_GATEWAY_API_KEY" "$AI_GATEWAY_URL/models"
```

### Deployment

- `npm run build` compiles the frontend. You **must** also deploy the `/api/generate` server-side function. Hosting the `dist/` folder alone on static-only hosting will not work.
- **GitHub + Vercel:** create a GitHub repository from this ZIP, import that repository into Vercel, then add `AI_GATEWAY_URL`, `AI_GATEWAY_API_KEY` and the three `AI_MODEL_*` settings under Project Settings → Environment Variables. `api/generate.ts` is the Vercel function. `AI_GATEWAY_URL` must be publicly reachable from Vercel, use HTTPS, and should require a gateway key.
- **Same EC2 host as OmniRoute:** `http://127.0.0.1:20128/v1` works only when the website **backend also runs on that EC2 host**. It will not work from an unrelated Vercel server. For production on EC2, run a backend serving `/api/generate` in addition to the Vite frontend; do not use `vite preview` as a production backend.
- For a public website, **restrict access** (deployment authentication / reverse proxy) and set request quotas/rate limits; otherwise anyone can use your gateway quota by calling `/api/generate`, even though the key itself remains secret.
- Vercel has request-size limits for serverless functions. If you submit many/large images, resize/compress them before uploading or use a backend with a higher upload limit.

### Model specifics

- Gemini: `gemini/gemini-2.5-flash`.
- Claude: `kiro/claude-sonnet-4.5-high`.
- DeepSeek: `dva/deepseek-v4-flash-high`.

### Current OmniRoute catalog check (20 November 2026)

The gateway key is restricted to exactly these three IDs: `gemini/gemini-2.5-flash`, `kiro/claude-sonnet-4.5-high`, and `dva/deepseek-v4-flash-high`. Key values are intentionally masked after creation, so put the key you saved at creation time in `AI_GATEWAY_API_KEY`; do not place it in browser code or commit it to this repository.

Gemini and Claude are listed as vision-capable. The dashboard does not declare image-input support for the selected DeepSeek Flash High entry, so test it with a non-sensitive sample image after deployment; if the gateway rejects it, do not send student uploads to that model until a vision-capable DeepSeek variant is available.

### Security

The browser never receives your `AI_GATEWAY_API_KEY`. Do **not** prefix it with `VITE_` or add it to client-side `process.env`. The server accepts only the three predefined model choices and forwards the existing math-image task with the original instructions.
