# Smart Parking Lot Backend

Production-oriented NestJS backend for a multi-floor smart parking lot. The service manages parking lot administration, spot availability, vehicle check-in, vehicle checkout, deterministic spot allocation, fee calculation, and database consistency with PostgreSQL and Prisma.

## Stack

- NestJS 11
- TypeScript
- PostgreSQL
- Prisma ORM
- class-validator and class-transformer
- Jest and Supertest
- Swagger/OpenAPI
- Docker Compose for local PostgreSQL

## Architecture

The app uses modular NestJS boundaries with thin controllers, service/use-case classes for application behavior, policy classes for domain rules, and Prisma repositories for persistence.

Main modules:

- `ParkingLotModule`: parking lot creation and lookup.
- `ParkingFloorModule`: floor creation and listing within a lot.
- `ParkingSpotModule`: spot creation, bulk creation, listing, and status changes.
- `ParkingAllocationModule`: compatibility rules, deterministic ordering, and row-locking allocation.
- `VehicleModule`: registration normalization and vehicle lookup/create behavior.
- `ParkingSessionModule`: vehicle check-in and checkout use cases.
- `FeeCalculationModule`: vehicle-specific pricing strategies and fee breakdowns.
- `AvailabilityModule`: grouped availability queries.
- `HealthModule`: application and database health checks.

Shared infrastructure:

- `PrismaModule` owns the Prisma client lifecycle.
- `ConfigModule` validates required environment variables at startup.
- Global validation pipe rejects unknown DTO properties.
- Global exception filter returns structured error responses.

## Database Model

Prisma models:

- `ParkingLot`
- `ParkingFloor`
- `ParkingSpot`
- `Vehicle`
- `ParkingSession`

Key constraints and indexes:

- Unique normalized vehicle registration number.
- Unique parking ticket number.
- Unique spot number within a floor.
- Indexes for available spot lookup by status, type, floor, active flag, priority, and spot number.
- Indexes for active session lookup by vehicle and spot.
- Manual PostgreSQL partial unique indexes enforce one active session per vehicle and one active session per spot.

Prisma cannot model PostgreSQL partial unique indexes directly, so they are included as custom SQL in the migration.

## Allocation Strategy

Spot compatibility rules:

- Motorcycle: motorcycle, compact, then large.
- Car: compact, then large.
- Bus: large only.

Allocation ordering:

1. Preferred compatible spot type.
2. Floor sort order.
3. Spot priority.
4. Spot number.
5. Spot id.

The allocation repository uses PostgreSQL `FOR UPDATE SKIP LOCKED` inside a transaction. It selects one available compatible spot, locks it, updates it to `RESERVED`, and returns it. The check-in transaction then creates the active session and marks the spot `OCCUPIED`.

This prevents two concurrent check-ins from receiving the same spot. Partial unique indexes also protect against multiple active sessions for the same vehicle or spot.

## Fee Calculation

Fees are calculated with vehicle-specific strategies and integer minor units.

Default INR rates:

- Motorcycle: first hour `2000` paise, additional started hour `1000` paise.
- Car: first hour `4000` paise, additional started hour `2000` paise.
- Bus: first hour `10000` paise, additional started hour `5000` paise.

Rules:

- Minimum billable duration is one hour.
- Partial hours round up to the next hour.
- Persisted totals use `bigint` minor units.
- Fee breakdown JSON stores money values as strings to avoid JSON bigint issues.

## API

All application APIs are under `/api/v1`, except `/health`.

Health:

```bash
GET /health
```

Parking lots and floors:

```bash
POST /api/v1/parking-lots
GET /api/v1/parking-lots
GET /api/v1/parking-lots/:id
POST /api/v1/parking-lots/:parkingLotId/floors
GET /api/v1/parking-lots/:parkingLotId/floors
```

Parking spots:

```bash
POST /api/v1/parking-floors/:floorId/spots
POST /api/v1/parking-floors/:floorId/spots/bulk
GET /api/v1/parking-floors/:floorId/spots
GET /api/v1/parking-spots?status=AVAILABLE&type=COMPACT
PATCH /api/v1/parking-spots/:id/status
```

Sessions:

```bash
POST /api/v1/parking-sessions/check-in
POST /api/v1/parking-sessions/check-out
```

Availability:

```bash
GET /api/v1/parking-lots/:parkingLotId/availability
```

Swagger is available at `/docs` outside production.

## API Examples

Create a parking lot:

```bash
curl -X POST http://localhost:3000/api/v1/parking-lots \
  -H "Content-Type: application/json" \
  -d '{"name":"Central Smart Parking","timezone":"Asia/Kolkata"}'
```

Create a floor:

```bash
curl -X POST http://localhost:3000/api/v1/parking-lots/<parkingLotId>/floors \
  -H "Content-Type: application/json" \
  -d '{"name":"Ground Floor","floorNumber":1,"sortOrder":1}'
```

Bulk create spots:

```bash
curl -X POST http://localhost:3000/api/v1/parking-floors/<floorId>/spots/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "spots": [
      {"spotNumber":"F1-M-01","type":"MOTORCYCLE","priority":1},
      {"spotNumber":"F1-C-01","type":"COMPACT","priority":2},
      {"spotNumber":"F1-L-01","type":"LARGE","priority":3}
    ]
  }'
```

Check in:

```bash
curl -X POST http://localhost:3000/api/v1/parking-sessions/check-in \
  -H "Content-Type: application/json" \
  -d '{"registrationNumber":"KA01AB1234","vehicleType":"CAR"}'
```

Check out:

```bash
curl -X POST http://localhost:3000/api/v1/parking-sessions/check-out \
  -H "Content-Type: application/json" \
  -d '{"ticketNumber":"PK-20260724-ABC123DEF0"}'
```

Or check out by registration number:

```bash
curl -X POST http://localhost:3000/api/v1/parking-sessions/check-out \
  -H "Content-Type: application/json" \
  -d '{"registrationNumber":"KA01AB1234"}'
```

## Error Response

Errors are returned in a consistent shape:

```json
{
  "statusCode": 409,
  "code": "VEHICLE_ALREADY_CHECKED_IN",
  "message": "The vehicle already has an active parking session",
  "timestamp": "2026-07-24T10:00:00.000Z",
  "path": "/api/v1/parking-sessions/check-in"
}
```

## Local Setup

Install dependencies:

```bash
npm.cmd install
```

Create local environment:

```bash
copy .env.example .env
```

Start PostgreSQL:

```bash
docker compose up -d
```

Generate Prisma client:

```bash
npm.cmd run prisma:generate
```

Apply migrations:

```bash
npm.cmd run prisma:migrate:dev
```

Seed data:

```bash
npm.cmd run prisma:seed
```

Start the app:

```bash
npm.cmd run start:dev
```

## Scripts

```bash
npm.cmd run format
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
npm.cmd run prisma:generate
npm.cmd run prisma:migrate:dev
npm.cmd run prisma:migrate:deploy
npm.cmd run prisma:seed
npm.cmd run prisma:studio
```

Use `npm.cmd` on Windows PowerShell to avoid execution-policy issues with `npm.ps1`.

## Testing

Unit tests cover:

- Registration normalization.
- Spot compatibility.
- Spot allocation ordering.
- Spot status transitions.
- Fee calculation and billable rounding.
- Check-in service behavior.
- Checkout service behavior.

E2E tests cover:

- Health checks.
- Full parking workflow through HTTP APIs.
- Concurrent check-in with a single compatible spot.
- Concurrent duplicate checkout for the same ticket.

E2E tests require a PostgreSQL database with migrations applied:

```bash
docker compose up -d
npm.cmd run prisma:migrate:dev
npm.cmd run test:e2e
```

## Production Notes

- Run `npm.cmd run prisma:migrate:deploy` in deployment environments.
- Set `NODE_ENV=production` to disable Swagger.
- Do not trust client-provided timestamps, fees, durations, or spot assignments.
- Keep administrative APIs behind authentication/authorization before exposing beyond local development.
- Do not remove the partial unique indexes from migrations; they protect critical session invariants.

## Known Limitations

- Authentication and authorization are not implemented yet.
- Rate limiting is not implemented yet.
- E2E tests require a real PostgreSQL database and were not designed to run against mocked persistence.
- Pricing is currently static and not stored in database rate cards.
- WebSocket or server-sent availability updates are not implemented yet.

## Future Improvements

- Add authentication and role-based access for administrative endpoints.
- Add rate cards and configurable pricing rules per parking lot.
- Add daily maximums, peak-hour pricing, lost ticket charges, discounts, and memberships.
- Add request correlation IDs across logs.
- Add API endpoints for active-session lookup and ticket lookup.
- Add WebSocket or SSE availability notifications.
- Add CI that starts PostgreSQL and runs migrations, unit tests, e2e tests, lint, and build.
