import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationError } from '../common/errors/application-error';
import { ErrorCode } from '../common/errors/error-code';
import { PrismaService } from '../prisma/prisma.service';
import { PARKING_ALLOCATION_REPOSITORY } from './parking-allocation.repository';
import {
  type AllocationTransactionClient,
  type ParkingAllocationRepository,
} from './parking-allocation.repository';
import {
  AllocatedParkingSpot,
  AllocateParkingSpotInput,
} from './parking-allocation.types';

@Injectable()
export class ParkingAllocationService {
  private readonly logger = new Logger(ParkingAllocationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PARKING_ALLOCATION_REPOSITORY)
    private readonly allocationRepository: ParkingAllocationRepository,
  ) {}

  reserveCompatibleSpot(
    input: AllocateParkingSpotInput,
    tx?: AllocationTransactionClient,
  ): Promise<AllocatedParkingSpot> {
    if (tx) {
      return this.reserveWithinTransaction(input, tx);
    }

    return this.prisma.$transaction(
      (transaction) => this.reserveWithinTransaction(input, transaction),
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  private async reserveWithinTransaction(
    input: AllocateParkingSpotInput,
    tx: AllocationTransactionClient,
  ): Promise<AllocatedParkingSpot> {
    this.logger.log({
      message: 'Spot allocation attempted',
      vehicleType: input.vehicleType,
      parkingLotId: input.parkingLotId,
    });

    const allocatedSpot = await this.allocationRepository.findAndReserveSpot(
      input,
      tx,
    );

    if (!allocatedSpot) {
      throw new ApplicationError(
        ErrorCode.NO_COMPATIBLE_PARKING_SPOT_AVAILABLE,
        'No compatible parking spot is available',
        HttpStatus.CONFLICT,
      );
    }

    this.logger.log({
      message: 'Spot allocated',
      vehicleType: input.vehicleType,
      parkingLotId: allocatedSpot.parkingLotId,
      parkingSpotId: allocatedSpot.id,
    });

    return allocatedSpot;
  }
}
