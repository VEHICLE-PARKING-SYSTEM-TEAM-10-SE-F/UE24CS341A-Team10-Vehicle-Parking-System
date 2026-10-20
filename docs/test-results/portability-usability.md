# Portability and usability test results (NFR-06, NFR-07)

Run on 20 Oct 2026 with `cd e2e && npm test` (Playwright). The tests drive the running application (React client, Express API, MongoDB) in real browsers.

## TC-PORT-01 – browser and screen-size compatibility (NFR-07)

Smoke suite: log in, slot availability, vehicle entry, vehicle exit with fee summary and confirmation, logout.
At every width the test also checks that the page never needs horizontal scrolling.

| Browser | 360 px | 768 px | 1366 px |
|---|---|---|---|
| Google Chrome (installed) | PASS | PASS | PASS |
| Microsoft Edge (installed) | PASS | PASS | PASS |
| WebKit (Safari engine, extra check) | PASS | PASS | PASS |
| Firefox | not run on this PC – see note | | |

**Note on Firefox:** Windows on the test PC blocked the Playwright Firefox build from starting ("spawn UNKNOWN"), so it never opened a page. This is a problem with the test environment, not the application. Before the final demo, run the same suite on a machine where Firefox starts:
```
cd e2e && npx playwright install firefox && npx playwright test --project=firefox
```
Alternatively, follow the steps above by hand in Firefox at those three widths.

## TC-USAB-01 – vehicle entry in at most 5 actions and under 60 seconds (NFR-06)

**Automated measurement** (`e2e/tests/usability.spec.js` counts every user action):

| Browser | User actions | Time |
|---|---|---|
| Chrome | 3 (open Entry, type registration number, Record entry) | 0.5 s |
| Edge | 3 | 0.5 s |
| WebKit | 3 | 2.5 s |

Target: at most 5 actions and under 60 s. **PASS.**

**Session with three first-time users** (Test Plan TC-USAB-01: three participants, 10 minutes of training each). The team fills this in when the session is run:

| Participant | Actions | Time (s) | Pass (≤ 5 actions, < 60 s) |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
