import { INestApplication } from '@nestjs/common';
import { ParkingSpotType, VehicleType } from '@prisma/client';
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
  assignedSpot: {
    id: string;
  };
}

describe('Parking concurrency (e2e)', () => {
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

  it('does not allocate the same single compatible spot to two concurrent vehicles', async () => {
    const lot = await createParkingLot(app, 'Single Spot Lot');
    const floor = await createParkingFloor(app, lot.id);

    await createSpots(app, floor.id, [
      { spotNumber: 'F1-C-01', type: ParkingSpotType.COMPACT, priority: 1 },
    ]);

    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/parking-sessions/check-in')
        .send({
          registrationNumber: 'KA01AA1111',
          vehicleType: VehicleType.CAR,
          parkingLotId: lot.id,
        }),
      request(app.getHttpServer())
        .post('/api/v1/parking-sessions/check-in')
        .send({
          registrationNumber: 'KA01BB2222',
          vehicleType: VehicleType.CAR,
          parkingLotId: lot.id,
        }),
    ]);
    const successfulResponses = responses.filter(
      (response) => response.status === 201,
    );

    expect(successfulResponses).toHaveLength(1);
    expect(
      responses.filter((response) => response.status === 409),
    ).toHaveLength(1);

    const [successfulResponse] = successfulResponses;
    const body = successfulResponse.body as CheckInResponse;

    expect(body.assignedSpot.id).toBeDefined();
  });

  it('does not complete and charge the same ticket twice under concurrent checkout', async () => {
    const lot = await createParkingLot(app, 'Duplicate Checkout Lot');
    const floor = await createParkingFloor(app, lot.id);

    await createSpots(app, floor.id, [
      { spotNumber: 'F1-C-01', type: ParkingSpotType.COMPACT, priority: 1 },
    ]);

    const checkInResponse = await request(app.getHttpServer())
      .post('/api/v1/parking-sessions/check-in')
      .send({
        registrationNumber: 'KA01CC3333',
        vehicleType: VehicleType.CAR,
        parkingLotId: lot.id,
      })
      .expect(201);
    const checkInBody = checkInResponse.body as CheckInResponse;
    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/parking-sessions/check-out')
        .send({ ticketNumber: checkInBody.ticketNumber }),
      request(app.getHttpServer())
        .post('/api/v1/parking-sessions/check-out')
        .send({ ticketNumber: checkInBody.ticketNumber }),
    ]);

    expect(
      responses.filter((response) => response.status === 200),
    ).toHaveLength(1);
    expect(
      responses.filter((response) => [404, 409].includes(response.status)),
    ).toHaveLength(1);
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
): Promise<CreatedParkingFloor> {
  const response = await request(app.getHttpServer())
    .post(`/api/v1/parking-lots/${parkingLotId}/floors`)
    .send({ name: 'Ground Floor', floorNumber: 1, sortOrder: 1 })
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
