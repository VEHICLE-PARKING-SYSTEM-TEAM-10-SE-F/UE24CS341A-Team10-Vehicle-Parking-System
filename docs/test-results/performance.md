# Performance test results (NFR-01 – NFR-03)

Run on 2026-10-20T06:06:26.880Z with `npm run perf -- --duration 600` against the running API
(Node v24.16.0, win32; test data: 500 vehicles, 100 slots).

| Test case | Requirement | Load | Result | Target | Verdict |
|---|---|---|---|---|---|
| TC-PERF-01 | NFR-01 vehicle search | 50 concurrent users, 600 s (ramp-up 30 s), 122005 requests | p95 0.620 s (avg 0.240 s, max 0.933 s), errors 0.00 % | p95 ≤ 3 s, errors < 1 % | **PASS** |
| TC-PERF-02 | NFR-02 entry with slot allocation | 20 concurrent users, 200 operations | p95 0.731 s (avg 0.363 s) | p95 ≤ 3 s | **PASS** |
| TC-PERF-02 | NFR-03 exit with fee calculation | 20 concurrent users, 200 operations | p95 0.202 s (avg 0.131 s) | p95 ≤ 3 s | **PASS** |

Errors during TC-PERF-02: 0.

## History

- **First run (20 Oct 2026): NFR-02 failed.** Entry p95 was 5.252 s with 20 concurrent users; search (p95 0.685 s) and exit (p95 0.397 s) passed.
  Cause: every entry transaction also incremented the shared daily ticket counter. Concurrent entries therefore conflicted on that one document and had to retry.
  Fix: the ticket number is now taken with a single atomic increment just before the entry transaction. The slot allocation and the parking record are still written together in one transaction (FR-14), and ticket numbers stay unique.
- **Re-run after the fix (above): all three pass.**
