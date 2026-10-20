# Deployment (SAD v1.1 §3.10, SRS SEC-04)

All client–server traffic must use **HTTPS with TLS 1.2 or higher** (SEC-04). There are two supported ways to deploy.

## Option A – Nginx in front of the API (the SAD deployment view)

1. Build the client: `cd client && npm ci && npm run build`. Copy `client/dist` to `/var/www/vps/client/dist`.
2. Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/vps` and set your domain and certificate paths. Enable the site and reload Nginx.
3. In `server/.env` set:
   ```
   TRUST_PROXY=true
   REQUIRE_HTTPS=true
   ```
   Express then trusts Nginx's `X-Forwarded-Proto`. A plain-HTTP request that somehow reaches the API is redirected (GET) or refused (anything else).
4. Start the API with PM2: `cd server && npm ci --omit=dev && pm2 start src/server.js --name vps-api`.

Nginx accepts only `TLSv1.2` and `TLSv1.3`, redirects port 80 to 443, and sends an HSTS header.

## Option B – the API serves HTTPS itself

Set these in `server/.env`:
```
TLS_CERT_FILE=/path/to/fullchain.pem
TLS_KEY_FILE=/path/to/privkey.pem
HTTPS_PORT=5443
```
`npm start` then serves HTTPS on `HTTPS_PORT` with a minimum of TLS 1.2. Plain HTTP on `PORT` only redirects to HTTPS.

## Verifying SEC-04 (Test Plan TC-SEC-04)

- Automated: `server/tests/https.test.js`. It checks that TLS 1.0 and 1.1 are refused, TLS 1.2 and 1.3 are accepted, the HSTS header is sent, and HTTP is redirected.
- On the deployed server: run `testssl.sh https://parking.example.com`, or the SSL Labs test. Only TLS 1.2 and 1.3 should be offered.
