import { type ParkingFloor, type Prisma } from '@prisma/client';

export const PARKING_FLOOR_REPOSITORY = Symbol('PARKING_FLOOR_REPOSITORY');

export interface ParkingFloorRepository {
  create(data: Prisma.ParkingFloorUncheckedCreateInput): Promise<ParkingFloor>;
  findByParkingLotId(parkingLotId: string): Promise<ParkingFloor[]>;
  findById(id: string): Promise<ParkingFloor | null>;
}
