import { type ParkingLot, type Prisma } from '@prisma/client';

export const PARKING_LOT_REPOSITORY = Symbol('PARKING_LOT_REPOSITORY');

export interface ParkingLotRepository {
  create(data: Prisma.ParkingLotCreateInput): Promise<ParkingLot>;
  findMany(): Promise<ParkingLot[]>;
  findById(id: string): Promise<ParkingLot | null>;
}
