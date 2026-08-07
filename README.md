# Laurier Course Checker

Polls LORIS's public course search (no login required) for the sections listed in
[`src/config.js`](src/config.js) and emails you when a seat or waitlist spot opens up.
Currently watching **EC260, Winter 2027**.

How it works: `src/lorisClient.js` establishes an anonymous LORIS session, sets the term,
and hits the same JSON endpoint the course search page uses
(`/register/ssb/searchResults/searchResults`). `src/checkAvailability.js` compares the
result against [`state.json`](state.json) from the last run and only emails on a
closed → open transition (via [Resend](https://resend.com)), so you get one alert per
opening, not one every 15 minutes.

## One-time setup

1. **Resend account** (free tier): sign up at [resend.com](https://resend.com), then grab
   an API key from the dashboard. No domain verification needed — the default
   `onboarding@resend.dev` sender works as long as you send to the email address your
   Resend account is registered with.
2. **Push this to GitHub**, then add two repo secrets under
   *Settings → Secrets and variables → Actions*:
   - `RESEND_API_KEY` — the key from step 1
   - `ALERT_EMAIL` — the address to notify (must match your Resend account's email
     unless you verify a sending domain)
3. That's it — [`.github/workflows/check-availability.yml`](.github/workflows/check-availability.yml)
   runs every 15 minutes via `workflow_dispatch`/`schedule`, and commits `state.json`
   back to the repo when it changes so state persists between runs.

## Run locally

```bash
npm install
RESEND_API_KEY=... ALERT_EMAIL=... npm run check
```

## Watching a different course

Edit the `COURSES` array in `src/config.js`. `termCode` is Banner's term format:
`YYYY` + `01` (Winter) / `05` (Spring) / `09` (Fall) — e.g. `202701` is Winter 2027.
