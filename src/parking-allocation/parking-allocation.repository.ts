import { type Prisma } from '@prisma/client';
import {
  AllocatedParkingSpot,
  AllocateParkingSpotInput,
} from './parking-allocation.types';

export const PARKING_ALLOCATION_REPOSITORY = Symbol(
  'PARKING_ALLOCATION_REPOSITORY',
);

export type AllocationTransactionClient = Pick<
  Prisma.TransactionClient,
  '$queryRaw'
>;

export interface ParkingAllocationRepository {
  findAndReserveSpot(
    input: AllocateParkingSpotInput,
    tx: AllocationTransactionClient,
  ): Promise<AllocatedParkingSpot | null>;
}
