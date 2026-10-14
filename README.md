# Vehicle Parking System — Team 10

**Software Engineering (UE24CS341A) Mini-Project · Semester 5 · Section F · PES University, Bengaluru**

A web-based system for managing parking slots and tracking vehicles. Parking attendants register vehicles, check slot availability, record vehicle entry and exit, and search for a vehicle to see where it is parked and its history. On entry the system allocates a matching slot; on exit it calculates the fee and releases the slot. The fee uses hourly rates with a fixed 15-minute grace period. Administrators also manage slots, users and hourly rates, and generate the parking occupancy report.

| | |
|---|---|
| **Team #** | 10 (Section F) |
| **Problem statement** | Vehicle Parking System – a system for managing parking slots and vehicle tracking |
| **Tech stack** | MERN – MongoDB, Express.js, React.js, Node.js |

## Team

| Name | SRN |
|---|---|
| Pandi Snehitha | PES1UG24CS315 |
| Pramiti Ragavendra Udupa | PES1UG24CS331 |
| Ramitha R | PES1UG24CS368 |

## Part-1 Deliverables (due 07-10-2026)

| # | Deliverable | Location | Status |
|---|---|---|---|
| 1 | Software Requirements Specification (IEEE format) | [`docs/SRS/`](docs/SRS/) | ✅ Final v1.1 ([PDF](docs/SRS/Vehicle_Parking_System_SRS_v1.1.pdf)) |
| 2 | Software Test Plan (IEEE format, with 37 test cases) | [`docs/TestPlan/`](docs/TestPlan/) | ✅ Final v1.1 ([PDF](docs/TestPlan/Vehicle_Parking_System_Test_Plan_v1.1.pdf)) |
| 3 | Software Architecture & Design Specification (SAD) | [`docs/SAD/`](docs/SAD/) | ✅ Final v1.1 ([PDF](docs/SAD/Team10_Vehicle_Parking_System_SAD.pdf)) |
| 4 | Implementation start + sprint activity | [`docs/Sprint-Plan.md`](docs/Sprint-Plan.md) | Backlog and two sprints planned (see Part-2) |

## Part-2 Deliverables

| # | Deliverable | Due | Where | Status |
|---|---|---|---|---|
| 1 | GitHub Project linked to the repo; backlog from SRS FRs/NFRs, story points, assignees, two sprints | 12-10-2026 | [Project board](https://github.com/orgs/VEHICLE-PARKING-SYSTEM-TEAM-10-SE-F/projects/1) · [Jira backlog](https://pramitiudupa.atlassian.net/jira/software/c/projects/VPS/boards/34/backlog) · [Issues](https://github.com/VEHICLE-PARKING-SYSTEM-TEAM-10-SE-F/UE24CS341A-Team10-Vehicle-Parking-System/issues) · [`docs/Sprint-Plan.md`](docs/Sprint-Plan.md) | ✅ 38 stories, 105 story points |
| 2 | Sprint 1: implementation, GitHub Actions, PRs, 1-minute video | 19–23 Oct 2026 | Milestone **Sprint 1** | Planned (63 SP) |
| 3 | Sprint 2: implementation, 2-minute video, documentation, freeze | 26–30 Oct 2026 | Milestone **Sprint 2** | Planned (42 SP) |

## SAD at a glance

The SRS, SAD and Test Plan all use the same requirement IDs: FR-01…FR-23, NFR-01…NFR-07, SEC-01…SEC-07 and BR-01…BR-05. They also share the same test-case IDs. Every requirement maps to a component, a design section and at least one test case (SAD §3.8).

- **Architecture:** Layered three-tier (React SPA → Express REST API → MongoDB replica set), with the routes, security middleware, services and repositories kept in separate layers.
- **Components** (the names used in the SRS RTM): Security Middleware, Auth Service, User Management Service, Vehicle Service, Parking Slot Service, Parking Transaction Service, Fee Service, Report Service, Database Layer.
- **Key design points:** slot allocation and exit run inside transactions, backed by unique indexes, so a slot can never hold two vehicles. The fee is billable hours × hourly rate, after a fixed 15-minute grace period. Each JWT is tied to a server-side session, which lets logout cancel the token and ends the session after 15 minutes idle. Also: bcrypt hashing, server-side role checks (Parking Attendant / Administrator) and TLS. Threats are analysed with a STRIDE model.

| Component diagram | Deployment view |
|---|---|
| ![Component diagram](docs/diagrams/component.png) | ![Deployment](docs/diagrams/deployment.png) |

Sequence diagrams: [Vehicle entry & slot allocation](docs/diagrams/seq_entry.png) · [Vehicle exit & fee](docs/diagrams/seq_exit.png) · [Login](docs/diagrams/seq_login.png) · [Search & track vehicle](docs/diagrams/seq_search.png)

## Repository structure

```
.
├── README.md
├── docs/
│   ├── SRS/                  # Software Requirements Specification v1.1 (PDF + DOCX)
│   ├── SAD/                  # Software Architecture & Design Specification v1.1 (PDF + DOCX)
│   ├── TestPlan/             # Software Test Plan v1.1 with test cases (PDF + DOCX)
│   ├── Sprint-Plan.md        # Product backlog and sprint plan (Part-2)
│   ├── diagrams/             # UML component, deployment and sequence diagrams (PNG)
│   │   └── source/           # Python scripts that regenerate the diagrams and the SAD .docx
│   └── course-material/      # Templates and instructions given by the course
├── client/                   # React front end   (added in Sprint 1)
└── server/                   # Express back end  (added in Sprint 1)
```

## Regenerating the diagrams / SAD

```bash
pip install matplotlib python-docx
python docs/diagrams/source/generate_diagrams.py
python docs/diagrams/source/build_sad_docx.py
```
