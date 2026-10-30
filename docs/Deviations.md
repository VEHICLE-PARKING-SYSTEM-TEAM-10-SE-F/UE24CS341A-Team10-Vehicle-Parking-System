# Deviations from the submitted documents

SE Mini-Project Part-2 says: *"Deviations from the submitted document should be documented and explained during the final demo."*
This file lists every place where the implementation differs from **SRS v1.1**, **SAD v1.1** or **Test Plan v1.1**, and why.

| # | Document & section | What the document says | What we built | Why | Story / PR |
|---|---|---|---|---|---|
| D-1 | SAD v1.1 §4.3 (d), (e) – entry/exit API | `POST /parking/entry` and `POST /parking/exit` take `{ vehicleId }` | They take `{ regNo }`, the registration number | The attendant types the registration number. Using it directly avoids a separate lookup call, which keeps vehicle entry within the 5-action limit of NFR-06. The server still looks up the vehicle and uses its internal id for the parking record. | FR-11, FR-15 (`feature/vehicles-slots-parking`) |
| D-2 | Test Plan v1.1 §5, §6 – performance tool | Performance tests run with Apache JMeter | They run with `server/scripts/perf.js` (`npm run perf`), a Node.js load generator | It produces the same measurements the Test Plan asks for: 50 concurrent users for 10 minutes with a 30 s ramp-up, the 95th-percentile response time and the error rate (TC-PERF-01), and 20 users × 200 entry/exit operations (TC-PERF-02). It also runs on every team laptop without installing Java or JMeter. The results are saved in `docs/test-results/performance.md`. | NFR-01 – NFR-03 (`feature/s2-slot-status-performance`) |
