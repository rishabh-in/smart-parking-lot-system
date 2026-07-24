import {
  type ParkingSpot,
  type ParkingSpotStatus,
  type ParkingSpotType,
  type Prisma,
} from '@prisma/client';

export const PARKING_SPOT_REPOSITORY = Symbol('PARKING_SPOT_REPOSITORY');

export interface ParkingSpotFilters {
  status?: ParkingSpotStatus;
  type?: ParkingSpotType;
}

export interface ParkingSpotRepository {
  create(data: Prisma.ParkingSpotUncheckedCreateInput): Promise<ParkingSpot>;
  createMany(
    data: Prisma.ParkingSpotUncheckedCreateInput[],
  ): Promise<ParkingSpot[]>;
  findByFloorId(floorId: string): Promise<ParkingSpot[]>;
  findMany(filters: ParkingSpotFilters): Promise<ParkingSpot[]>;
  findById(id: string): Promise<ParkingSpot | null>;
  updateStatus(id: string, status: ParkingSpotStatus): Promise<ParkingSpot>;
}
