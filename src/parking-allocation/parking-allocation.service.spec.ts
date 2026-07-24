import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ParkingSpotStatus,
  ParkingSpotType,
  VehicleType,
} from '@prisma/client';
import { ErrorCode } from '../common/errors/error-code';
import { PrismaService } from '../prisma/prisma.service';
import {
  AllocationTransactionClient,
  PARKING_ALLOCATION_REPOSITORY,
  ParkingAllocationRepository,
} from './parking-allocation.repository';
import { ParkingAllocationService } from './parking-allocation.service';

describe('ParkingAllocationService', () => {
  const transaction = jest.fn(
    async (
      callback: (
        transactionClient: AllocationTransactionClient,
      ) => Promise<unknown>,
    ) => callback(tx),
  );
  const findAndReserveSpot = jest.fn();
  const tx: AllocationTransactionClient = {
    $queryRaw: jest.fn(),
  };

  const prisma = {
    $transaction: transaction,
  };

  const repository: jest.Mocked<ParkingAllocationRepository> = {
    findAndReserveSpot,
  };

  let service: ParkingAllocationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingAllocationService,
        { provide: PrismaService, useValue: prisma },
        { provide: PARKING_ALLOCATION_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get(ParkingAllocationService);
  });

  it('reserves a compatible spot in a transaction', async () => {
    findAndReserveSpot.mockResolvedValue({
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

    await expect(
      service.reserveCompatibleSpot({ vehicleType: VehicleType.CAR }),
    ).resolves.toMatchObject({
      id: 'spot-id',
      status: ParkingSpotStatus.RESERVED,
    });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(findAndReserveSpot).toHaveBeenCalledWith(
      { vehicleType: VehicleType.CAR },
      tx,
    );
  });

  it('throws a domain error when no compatible spot is available', async () => {
    findAndReserveSpot.mockResolvedValue(null);

    await expect(
      service.reserveCompatibleSpot({ vehicleType: VehicleType.BUS }, tx),
    ).rejects.toMatchObject({
      code: ErrorCode.NO_COMPATIBLE_PARKING_SPOT_AVAILABLE,
      statusCode: HttpStatus.CONFLICT,
    });
  });
});
