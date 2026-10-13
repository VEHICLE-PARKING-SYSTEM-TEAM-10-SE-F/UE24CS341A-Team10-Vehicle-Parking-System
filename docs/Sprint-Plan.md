# Product Backlog & Sprint Plan — Vehicle Parking System (Team 10)

SE Mini-Project **Part-2**. The backlog has one GitHub issue per functional and non-functional requirement in [SRS v1.1](SRS/Vehicle_Parking_System_SRS_v1.1.pdf) (FR, NFR and the SEC security NFRs), plus one setup/CI task. Each issue includes the requirement text exactly as written in the SRS, acceptance criteria taken from the [Test Plan v1.1](TestPlan/Vehicle_Parking_System_Test_Plan_v1.1.pdf), the story points, the assignee and the sprint. Each issue also has a link to the design in the [SAD v1.1](SAD/Team10_Vehicle_Parking_System_SAD.pdf).

- **Project board (linked to this repo):** [https://github.com/users/pramitiudupa/projects/1](https://github.com/users/pramitiudupa/projects/1). It has **Story Points** and **Sprint** fields; group by Sprint or by Assignee.
- **Jira (Scrum project VPS):** [board](https://pramitiudupa.atlassian.net/jira/software/c/projects/VPS/boards/34) · [backlog](https://pramitiudupa.atlassian.net/jira/software/c/projects/VPS/boards/34/backlog). It has the same 38 stories under 11 epics (one per SRS feature area), with Story Points and Sprint 1 / Sprint 2. Each GitHub issue links to its Jira story.
- **Issues:** [https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues), filterable by milestone **Sprint 1** / **Sprint 2**, by assignee, or by label `sp:N`
- **Story points:** Fibonacci scale (1, 2, 3, 5), based on relative size and risk
- **Dry run:** 12–16 Oct (practice sprint); the backlog may still be adjusted on 19 Oct

## Sprints

| Sprint | Dates | Goal | Story points |
|---|---|---|---|
| Sprint 1 | 19 Oct – 23 Oct 2026 | Working core product: login and roles, vehicle registration, slots, vehicle entry with slot allocation, exit with fee calculation, search and status, and CI with GitHub Actions | 63 |
| Sprint 2 | 26 Oct – 30 Oct 2026 | Complete the product: user management, slot availability toggle, hourly rate configuration, parking history, occupancy report, session timeout and HTTPS; performance, concurrency, reliability, usability and compatibility testing; final documentation and code freeze | 42 |

## Team load

| Member | GitHub | Area (from Test Plan §9) | Sprint 1 | Sprint 2 | Total |
|---|---|---|---|---|---|
| Ramitha R | @Ramitha-R6 | Authentication, users, security, reliability | 19 | 16 | 35 |
| Pandi Snehitha | @snehitha796 | Vehicles, slots, vehicle entry, exit, performance | 24 | 9 | 33 |
| Pramiti Ragavendra Udupa | @pramitiudupa | Setup/CI, fees, search and history, report, usability, portability, HTTPS | 20 | 17 | 37 |
| **Total** | | | **63** | **42** | **105** |

## Sprint 1 backlog (2026-10-19 → 2026-10-23)

| Issue | Jira | Req. ID | Story | Priority | SP | Assignee | Test case(s) |
|---|---|---|---|---|---|---|---|
| [#1](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/1) | [VPS-12](https://pramitiudupa.atlassian.net/browse/VPS-12) | SETUP | Project setup and CI (GitHub Actions) | High | 5 | Pramiti Ragavendra Udupa | — |
| [#2](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/2) | [VPS-13](https://pramitiudupa.atlassian.net/browse/VPS-13) | FR-01 | Login with username and password | High | 3 | Ramitha R | TC-AUTH-01 |
| [#3](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/3) | [VPS-14](https://pramitiudupa.atlassian.net/browse/VPS-14) | FR-02 | Generic message for invalid credentials | High | 1 | Ramitha R | TC-AUTH-02 |
| [#4](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/4) | [VPS-15](https://pramitiudupa.atlassian.net/browse/VPS-15) | FR-03 | Logout invalidates the session | High | 2 | Ramitha R | TC-AUTH-03 |
| [#6](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/6) | [VPS-17](https://pramitiudupa.atlassian.net/browse/VPS-17) | FR-05 | Deny out-of-role requests with HTTP 403 | High | 3 | Ramitha R | TC-AUTH-05 |
| [#7](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/7) | [VPS-18](https://pramitiudupa.atlassian.net/browse/VPS-18) | FR-06 | Register a vehicle | High | 3 | Pandi Snehitha | TC-VEH-01, TC-VEH-03 |
| [#8](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/8) | [VPS-19](https://pramitiudupa.atlassian.net/browse/VPS-19) | FR-07 | Reject invalid or duplicate vehicle registration | High | 2 | Pandi Snehitha | TC-VEH-02, TC-VEH-03 |
| [#9](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/9) | [VPS-20](https://pramitiudupa.atlassian.net/browse/VPS-20) | FR-08 | Administrator adds a parking slot | High | 2 | Pandi Snehitha | TC-SLOT-01 |
| [#11](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/11) | [VPS-22](https://pramitiudupa.atlassian.net/browse/VPS-22) | FR-10 | Display slot availability with counts | High | 3 | Pramiti Ragavendra Udupa | TC-SLOT-03 |
| [#12](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/12) | [VPS-23](https://pramitiudupa.atlassian.net/browse/VPS-23) | FR-11 | Record vehicle entry | High | 3 | Pandi Snehitha | TC-ENT-01, TC-ENT-02 |
| [#13](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/13) | [VPS-24](https://pramitiudupa.atlassian.net/browse/VPS-24) | FR-12 | Automatic and manual slot allocation | High | 5 | Pandi Snehitha | TC-ENT-01, TC-ENT-04 |
| [#14](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/14) | [VPS-25](https://pramitiudupa.atlassian.net/browse/VPS-25) | FR-13 | Refuse entry when no matching slot is free | High | 1 | Pandi Snehitha | TC-ENT-03 |
| [#15](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/15) | [VPS-26](https://pramitiudupa.atlassian.net/browse/VPS-26) | FR-14 | Atomic parking record with ticket number | High | 5 | Pandi Snehitha | TC-ENT-01 |
| [#16](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/16) | [VPS-27](https://pramitiudupa.atlassian.net/browse/VPS-27) | FR-15 | Record vehicle exit | High | 3 | Pandi Snehitha | TC-EXT-01, TC-EXT-02 |
| [#17](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/17) | [VPS-28](https://pramitiudupa.atlassian.net/browse/VPS-28) | FR-16 | Fee calculation with fixed 15-minute grace period | High | 3 | Pramiti Ragavendra Udupa | TC-EXT-03, TC-FEE-02 |
| [#18](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/18) | [VPS-29](https://pramitiudupa.atlassian.net/browse/VPS-29) | FR-17 | Show fee summary before confirming exit | High | 2 | Pramiti Ragavendra Udupa | TC-EXT-01 |
| [#19](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/19) | [VPS-30](https://pramitiudupa.atlassian.net/browse/VPS-30) | FR-18 | Complete record and release slot on exit | High | 3 | Pramiti Ragavendra Udupa | TC-EXT-01 |
| [#21](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/21) | [VPS-32](https://pramitiudupa.atlassian.net/browse/VPS-32) | FR-20 | Search a vehicle by registration number | High | 2 | Pramiti Ragavendra Udupa | TC-SRCH-01 |
| [#22](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/22) | [VPS-33](https://pramitiudupa.atlassian.net/browse/VPS-33) | FR-21 | Show current status of a vehicle | High | 2 | Pramiti Ragavendra Udupa | TC-SRCH-02 |
| [#32](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/32) | [VPS-43](https://pramitiudupa.atlassian.net/browse/VPS-43) | SEC-01 | Authentication required for every function except login | High | 2 | Ramitha R | TC-AUTH-01, TC-SEC-01 |
| [#33](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/33) | [VPS-44](https://pramitiudupa.atlassian.net/browse/VPS-44) | SEC-02 | Server-side role-based authorization | High | 3 | Ramitha R | TC-AUTH-05, TC-SEC-02 |
| [#34](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/34) | [VPS-45](https://pramitiudupa.atlassian.net/browse/VPS-45) | SEC-03 | Passwords stored as bcrypt hashes | High | 1 | Ramitha R | TC-SEC-03 |
| [#36](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/36) | [VPS-47](https://pramitiudupa.atlassian.net/browse/VPS-47) | SEC-05 | Server-side input validation | High | 3 | Ramitha R | TC-SEC-05 |
| [#38](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/38) | [VPS-49](https://pramitiudupa.atlassian.net/browse/VPS-49) | SEC-07 | Secrets kept in environment configuration | Medium | 1 | Ramitha R | TC-SEC-07 |

## Sprint 2 backlog (2026-10-26 → 2026-10-30)

| Issue | Jira | Req. ID | Story | Priority | SP | Assignee | Test case(s) |
|---|---|---|---|---|---|---|---|
| [#5](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/5) | [VPS-16](https://pramitiudupa.atlassian.net/browse/VPS-16) | FR-04 | Administrator manages user accounts and roles | High | 5 | Ramitha R | TC-AUTH-04 |
| [#10](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/10) | [VPS-21](https://pramitiudupa.atlassian.net/browse/VPS-21) | FR-09 | Set a slot Unavailable / Available | Medium | 2 | Pandi Snehitha | TC-SLOT-02 |
| [#20](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/20) | [VPS-31](https://pramitiudupa.atlassian.net/browse/VPS-31) | FR-19 | Configure hourly rate per vehicle type | Medium | 3 | Pramiti Ragavendra Udupa | TC-FEE-01, TC-FEE-02 |
| [#23](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/23) | [VPS-34](https://pramitiudupa.atlassian.net/browse/VPS-34) | FR-22 | Parking history of a vehicle | Medium | 3 | Pramiti Ragavendra Udupa | TC-SRCH-03 |
| [#24](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/24) | [VPS-35](https://pramitiudupa.atlassian.net/browse/VPS-35) | FR-23 | Parking Occupancy Report | Medium | 3 | Pramiti Ragavendra Udupa | TC-REP-01 |
| [#25](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/25) | [VPS-36](https://pramitiudupa.atlassian.net/browse/VPS-36) | NFR-01 | Vehicle search response time ≤ 3 s | High | 3 | Pandi Snehitha | TC-PERF-01 |
| [#26](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/26) | [VPS-37](https://pramitiudupa.atlassian.net/browse/VPS-37) | NFR-02 | Vehicle entry response time ≤ 3 s | High | 2 | Pandi Snehitha | TC-PERF-02 |
| [#27](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/27) | [VPS-38](https://pramitiudupa.atlassian.net/browse/VPS-38) | NFR-03 | Vehicle exit response time ≤ 3 s | High | 2 | Pandi Snehitha | TC-PERF-02 |
| [#28](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/28) | [VPS-39](https://pramitiudupa.atlassian.net/browse/VPS-39) | NFR-04 | No double allocation under concurrency | High | 5 | Ramitha R | TC-CONC-01 |
| [#29](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/29) | [VPS-40](https://pramitiudupa.atlassian.net/browse/VPS-40) | NFR-05 | Acknowledged operations survive a restart | High | 3 | Ramitha R | TC-REL-01 |
| [#30](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/30) | [VPS-41](https://pramitiudupa.atlassian.net/browse/VPS-41) | NFR-06 | Vehicle entry in ≤ 5 actions and ≤ 60 s | Medium | 2 | Pramiti Ragavendra Udupa | TC-USAB-01 |
| [#31](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/31) | [VPS-42](https://pramitiudupa.atlassian.net/browse/VPS-42) | NFR-07 | Browser and screen-size compatibility | Medium | 3 | Pramiti Ragavendra Udupa | TC-PORT-01 |
| [#35](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/35) | [VPS-46](https://pramitiudupa.atlassian.net/browse/VPS-46) | SEC-04 | HTTPS with TLS 1.2 or higher | High | 3 | Pramiti Ragavendra Udupa | TC-SEC-04 |
| [#37](https://github.com/pramitiudupa/UE24CS341A-Team10-Vehicle-Parking-System/issues/37) | [VPS-48](https://pramitiudupa.atlassian.net/browse/VPS-48) | SEC-06 | Session ends after 15 minutes of inactivity | Medium | 3 | Ramitha R | TC-SEC-06 |

## Workflow (Part-2 rules)

1. The assignee creates a branch `feature/<issue-no>-<short-name>` from `main`.
2. The assignee commits with the issue number in the message (e.g. `FR-11: record vehicle entry (#12)`) and **raises the pull request**, with `Closes #<issue>` in the PR description.
3. GitHub Actions runs lint and tests on the PR.
4. The repo owner (@pramitiudupa) reviews and merges the PR.
5. Any deviation from the SRS, SAD or Test Plan is noted in the PR and recorded in `docs/Deviations.md` for the final demo.
6. At the end of each sprint, a short video of the working product is uploaded to `docs/videos/` (1 minute for Sprint 1, 2 minutes for Sprint 2).
