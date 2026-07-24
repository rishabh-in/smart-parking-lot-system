import { type ParkingSession, type Prisma } from '@prisma/client';

export const PARKING_SESSION_REPOSITORY = Symbol('PARKING_SESSION_REPOSITORY');

export type ParkingSessionTransactionClient = Pick<
  Prisma.TransactionClient,
  'parkingSession' | 'parkingSpot'
>;

export interface ParkingSessionRepository {
  findActiveByVehicleId(
    vehicleId: string,
    tx: ParkingSessionTransactionClient,
  ): Promise<ParkingSession | null>;
  create(
    data: Prisma.ParkingSessionUncheckedCreateInput,
    tx: ParkingSessionTransactionClient,
  ): Promise<ParkingSession>;
  updateSpotStatus(
    parkingSpotId: string,
    status: Prisma.EnumParkingSpotStatusFieldUpdateOperationsInput['set'],
    tx: ParkingSessionTransactionClient,
  ): Promise<void>;
}
