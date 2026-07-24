import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ParkingSessionStatus,
  ParkingSpotStatus,
  ParkingSpotType,
  VehicleType,
} from '@prisma/client';
import { ErrorCode } from '../common/errors/error-code';
import { CLOCK, type Clock } from '../common/time/clock';
import { ParkingAllocationService } from '../parking-allocation/parking-allocation.service';
import { PrismaService } from '../prisma/prisma.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { ParkingTicketNumberGenerator } from './parking-ticket-number.generator';
import { PARKING_SESSION_REPOSITORY } from './parking-session.repository';
import { type ParkingSessionRepository } from './parking-session.repository';
import { ParkingSessionService } from './parking-session.service';

describe('ParkingSessionService', () => {
  const tx = {
    vehicle: {},
    parkingSession: {},
    parkingSpot: {},
    $queryRaw: jest.fn(),
  };
  const transaction = jest.fn((callback: (client: typeof tx) => unknown) =>
    Promise.resolve(callback(tx)),
  );
  const normalizedRegistrationNumber = 'KA01AB1234';
  const entryAt = new Date('2026-07-24T10:00:00.000Z');

  const prisma = { $transaction: transaction };
  const vehicles = {
    normalizeRegistrationNumber: jest.fn(() => normalizedRegistrationNumber),
    findOrCreateVehicle: jest.fn(),
  };
  const allocation = {
    reserveCompatibleSpot: jest.fn(),
  };
  const ticketNumbers = {
    generate: jest.fn(() => 'PK-20260724-ABC123DEF0'),
  };
  const clock: Clock = {
    now: jest.fn(() => entryAt),
  };
  const findActiveByVehicleId = jest.fn();
  const create = jest.fn();
  const updateSpotStatus = jest.fn();
  const parkingSessions: jest.Mocked<ParkingSessionRepository> = {
    findActiveByVehicleId,
    create,
    updateSpotStatus,
  };

  let service: ParkingSessionService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingSessionService,
        { provide: PrismaService, useValue: prisma },
        { provide: VehicleService, useValue: vehicles },
        { provide: ParkingAllocationService, useValue: allocation },
        { provide: ParkingTicketNumberGenerator, useValue: ticketNumbers },
        { provide: CLOCK, useValue: clock },
        { provide: PARKING_SESSION_REPOSITORY, useValue: parkingSessions },
      ],
    }).compile();

    service = module.get(ParkingSessionService);
  });

  it('normalizes a vehicle, reserves a spot, creates a session, and occupies the spot', async () => {
    vehicles.findOrCreateVehicle.mockResolvedValue({
      id: 'vehicle-id',
      registrationNumber: normalizedRegistrationNumber,
      vehicleType: VehicleType.CAR,
      createdAt: entryAt,
      updatedAt: entryAt,
    });
    findActiveByVehicleId.mockResolvedValue(null);
    allocation.reserveCompatibleSpot.mockResolvedValue({
      id: 'spot-id',
      floorId: 'floor-id',
      parkingLotId: 'lot-id',
      spotNumber: 'F1-C-01',
      type: ParkingSpotType.COMPACT,
      status: ParkingSpotStatus.RESERVED,
      priority: 1,
      floorName: 'Ground Floor',
      floorNumber: 1,
      floorSortOrder: 1,
    });
    create.mockResolvedValue({
      id: 'session-id',
      ticketNumber: 'PK-20260724-ABC123DEF0',
      vehicleId: 'vehicle-id',
      parkingSpotId: 'spot-id',
      entryAt,
      exitAt: null,
      status: ParkingSessionStatus.ACTIVE,
      durationMinutes: null,
      totalFeeMinorUnits: null,
      currency: 'INR',
      feeBreakdown: null,
      createdAt: entryAt,
      updatedAt: entryAt,
    });
    updateSpotStatus.mockResolvedValue(undefined);

    await expect(
      service.checkIn({
        registrationNumber: ' ka-01 ab 1234 ',
        vehicleType: VehicleType.CAR,
      }),
    ).resolves.toMatchObject({
      ticketNumber: 'PK-20260724-ABC123DEF0',
      registrationNumber: normalizedRegistrationNumber,
      assignedSpot: {
        id: 'spot-id',
        status: ParkingSpotStatus.OCCUPIED,
      },
    });

    expect(vehicles.normalizeRegistrationNumber).toHaveBeenCalledWith(
      ' ka-01 ab 1234 ',
    );
    expect(vehicles.findOrCreateVehicle).toHaveBeenCalledWith(
      normalizedRegistrationNumber,
      VehicleType.CAR,
      tx,
    );
    expect(allocation.reserveCompatibleSpot).toHaveBeenCalledWith(
      { vehicleType: VehicleType.CAR, parkingLotId: undefined },
      tx,
    );
    expect(updateSpotStatus).toHaveBeenCalledWith(
      'spot-id',
      ParkingSpotStatus.OCCUPIED,
      tx,
    );
  });

  it('rejects duplicate check-in for an active vehicle session', async () => {
    vehicles.findOrCreateVehicle.mockResolvedValue({
      id: 'vehicle-id',
      registrationNumber: normalizedRegistrationNumber,
      vehicleType: VehicleType.CAR,
      createdAt: entryAt,
      updatedAt: entryAt,
    });
    findActiveByVehicleId.mockResolvedValue({
      id: 'session-id',
      ticketNumber: 'PK-20260724-ACTIVE0001',
      vehicleId: 'vehicle-id',
      parkingSpotId: 'spot-id',
      entryAt,
      exitAt: null,
      status: ParkingSessionStatus.ACTIVE,
      durationMinutes: null,
      totalFeeMinorUnits: null,
      currency: 'INR',
      feeBreakdown: null,
      createdAt: entryAt,
      updatedAt: entryAt,
    });

    await expect(
      service.checkIn({
        registrationNumber: 'KA01AB1234',
        vehicleType: VehicleType.CAR,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.VEHICLE_ALREADY_CHECKED_IN,
      statusCode: HttpStatus.CONFLICT,
    });
    expect(allocation.reserveCompatibleSpot).not.toHaveBeenCalled();
  });
});
