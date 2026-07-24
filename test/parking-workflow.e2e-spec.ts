import { INestApplication } from '@nestjs/common';
import {
  ParkingSpotStatus,
  ParkingSpotType,
  VehicleType,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './helpers/e2e-app';
import { prisma, resetDatabase } from './helpers/database';

interface CreatedParkingLot {
  id: string;
}

interface CreatedParkingFloor {
  id: string;
}

interface CheckInResponse {
  ticketNumber: string;
  registrationNumber: string;
  assignedSpot: {
    id: string;
    type: ParkingSpotType;
    status: ParkingSpotStatus;
  };
}

interface CheckOutResponse {
  ticketNumber: string;
  sessionStatus: string;
  totalFeeMinorUnits: string;
  releasedSpot: {
    id: string;
    status: ParkingSpotStatus;
  };
}

interface AvailabilityResponse {
  floors: Array<{
    counts: Array<{
      type: ParkingSpotType;
      status: ParkingSpotStatus;
      count: number;
    }>;
  }>;
}

describe('Parking workflow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('creates a lot, spots, checks in vehicles, checks availability, and checks out vehicles', async () => {
    const lot = await createParkingLot(app, 'Workflow Lot');
    const floor = await createParkingFloor(app, lot.id, 'Ground Floor');

    await createSpots(app, floor.id, [
      { spotNumber: 'F1-M-01', type: ParkingSpotType.MOTORCYCLE, priority: 1 },
      { spotNumber: 'F1-C-01', type: ParkingSpotType.COMPACT, priority: 2 },
      { spotNumber: 'F1-L-01', type: ParkingSpotType.LARGE, priority: 3 },
    ]);

    const motorcycle = await checkIn(app, {
      registrationNumber: 'KA01AA1001',
      vehicleType: VehicleType.MOTORCYCLE,
      parkingLotId: lot.id,
    });
    const car = await checkIn(app, {
      registrationNumber: 'KA01BB2002',
      vehicleType: VehicleType.CAR,
      parkingLotId: lot.id,
    });
    const bus = await checkIn(app, {
      registrationNumber: 'KA01CC3003',
      vehicleType: VehicleType.BUS,
      parkingLotId: lot.id,
    });

    expect(motorcycle.assignedSpot.type).toBe(ParkingSpotType.MOTORCYCLE);
    expect(car.assignedSpot.type).toBe(ParkingSpotType.COMPACT);
    expect(bus.assignedSpot.type).toBe(ParkingSpotType.LARGE);

    await request(app.getHttpServer())
      .get(`/api/v1/parking-lots/${lot.id}/availability`)
      .expect(200)
      .expect((response) => {
        const body = response.body as AvailabilityResponse;
        const counts = body.floors.flatMap(
          (floorAvailability) => floorAvailability.counts,
        );

        expect(counts).toEqual(
          expect.arrayContaining([
            {
              type: ParkingSpotType.MOTORCYCLE,
              status: ParkingSpotStatus.OCCUPIED,
              count: 1,
            },
            {
              type: ParkingSpotType.COMPACT,
              status: ParkingSpotStatus.OCCUPIED,
              count: 1,
            },
            {
              type: ParkingSpotType.LARGE,
              status: ParkingSpotStatus.OCCUPIED,
              count: 1,
            },
          ]),
        );
      });

    await expectCheckout(app, motorcycle.ticketNumber, '2000');
    await expectCheckout(app, car.ticketNumber, '4000');
    await expectCheckout(app, bus.ticketNumber, '10000');

    await request(app.getHttpServer())
      .get(`/api/v1/parking-floors/${floor.id}/spots`)
      .expect(200)
      .expect((response) => {
        const spots = response.body as Array<{ status: ParkingSpotStatus }>;

        expect(spots).toHaveLength(3);
        expect(
          spots.every((spot) => spot.status === ParkingSpotStatus.AVAILABLE),
        ).toBe(true);
      });
  });
});

async function createParkingLot(
  app: INestApplication<App>,
  name: string,
): Promise<CreatedParkingLot> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/parking-lots')
    .send({ name, timezone: 'Asia/Kolkata' })
    .expect(201);

  return response.body as CreatedParkingLot;
}

async function createParkingFloor(
  app: INestApplication<App>,
  parkingLotId: string,
  name: string,
): Promise<CreatedParkingFloor> {
  const response = await request(app.getHttpServer())
    .post(`/api/v1/parking-lots/${parkingLotId}/floors`)
    .send({ name, floorNumber: 1, sortOrder: 1 })
    .expect(201);

  return response.body as CreatedParkingFloor;
}

async function createSpots(
  app: INestApplication<App>,
  floorId: string,
  spots: Array<{
    spotNumber: string;
    type: ParkingSpotType;
    priority: number;
  }>,
): Promise<void> {
  await request(app.getHttpServer())
    .post(`/api/v1/parking-floors/${floorId}/spots/bulk`)
    .send({ spots })
    .expect(201);
}

async function checkIn(
  app: INestApplication<App>,
  body: {
    registrationNumber: string;
    vehicleType: VehicleType;
    parkingLotId: string;
  },
): Promise<CheckInResponse> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/parking-sessions/check-in')
    .send(body)
    .expect(201);

  return response.body as CheckInResponse;
}

async function expectCheckout(
  app: INestApplication<App>,
  ticketNumber: string,
  expectedTotalFeeMinorUnits: string,
): Promise<void> {
  await request(app.getHttpServer())
    .post('/api/v1/parking-sessions/check-out')
    .send({ ticketNumber })
    .expect(200)
    .expect((response) => {
      const body = response.body as CheckOutResponse;

      expect(body.ticketNumber).toBe(ticketNumber);
      expect(body.sessionStatus).toBe('COMPLETED');
      expect(body.totalFeeMinorUnits).toBe(expectedTotalFeeMinorUnits);
      expect(body.releasedSpot.status).toBe(ParkingSpotStatus.AVAILABLE);
    });
}
