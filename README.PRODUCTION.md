Frontend (Next) — Production setup

This file documents how to prepare and run `frontend-next` in production.

Required environment variables
- `NEXT_PUBLIC_API_BASE_URL` — public API base used by client-side code. Example: `https://api.tourealo.com/api`
- `API_BASE_URL` — (optional) server-side API base for server components. Default to same as `NEXT_PUBLIC_API_BASE_URL`.
- `NEXT_PUBLIC_SITE_URL` — public site origin for canonical URLs. Example: `https://tourealo.com`
- `NEXT_PUBLIC_DEFAULT_LANGUAGE` — optional default language (e.g. `en`).

Important notes about auth & cookies
- If the backend issues HttpOnly cookies for auth, ensure the API and frontend are served from the same parent domain or set the cookie `Domain`/`SameSite` appropriately.
- For cross-domain setups, cookies need `SameSite=None; Secure` and the frontend must call fetch with `credentials: "include"` and the API must allow credentials in CORS.

Deploy options
1) Vercel (recommended for Next projects)
   - Create a new project pointing to this repo.
   - In Vercel project settings -> Environment Variables, set the variables from above for `Production`.
   - Set the root path to the `frontend-next` folder if monorepo.
   - Deploy. Vercel will run `npm run build` and serve the app.

2) Render / Fly / other Node hosts
   - Set env vars in the service settings.
   - Use `npm run build` and `npm start` as the start command.

3) Docker (self-hosting) — using the included Dockerfile
   - Build image:

```powershell
cd frontend-next
docker build -t tourealo/frontend-next:latest .
```

   - Run container (pass env vars):

```powershell
docker run -e NEXT_PUBLIC_API_BASE_URL=https://api.tourealo.com/api -e NEXT_PUBLIC_SITE_URL=https://tourealo.com -p 3000:3000 tourealo/frontend-next:latest
```

   - Or use `docker-compose.prod.yml` with a `.env` file containing the env vars.

Checklist before enabling production traffic
- [ ] Ensure `NEXT_PUBLIC_API_BASE_URL` points to `https://api.tourealo.com/api` (or your API origin)
- [ ] Verify CORS settings on the API allow production origin and credentials if needed
- [ ] Confirm cookies (auth) are configured for the production domain and `Secure` flag
- [ ] Run `npm run build` locally or in CI to verify no build errors
- [ ] Configure TLS (HTTPS) for frontend and API


Troubleshooting build errors
- If `next build` fails, read the error log. Common causes:
  - Missing `NEXT_PUBLIC_API_BASE_URL` — set env var for build time
  - TypeScript errors — run `npx tsc --noEmit` to see type errors

If you want, I can:
- Run a production `npm run build` here and fix build/type errors.
- Add a simple CI workflow (`.github/workflows/frontend.yml`) to run builds and publish images to a registry.
