import {
  type ParkingSession,
  type ParkingSessionStatus,
  type ParkingSpotStatus,
  type ParkingSpotType,
  type Prisma,
  type VehicleType,
} from '@prisma/client';

export const PARKING_SESSION_REPOSITORY = Symbol('PARKING_SESSION_REPOSITORY');

export type ParkingSessionTransactionClient = Pick<
  Prisma.TransactionClient,
  'parkingSession' | 'parkingSpot' | '$queryRaw'
>;

export interface ActiveParkingSessionForCheckout {
  id: string;
  ticketNumber: string;
  vehicleId: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  parkingSpotId: string;
  parkingSpotNumber: string;
  parkingSpotType: ParkingSpotType;
  parkingSpotStatus: ParkingSpotStatus;
  floorId: string;
  floorName: string;
  floorNumber: number;
  parkingLotId: string;
  entryAt: Date;
  status: ParkingSessionStatus;
}

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
  findActiveForCheckout(
    input: { ticketNumber?: string; registrationNumber?: string },
    tx: ParkingSessionTransactionClient,
  ): Promise<ActiveParkingSessionForCheckout | null>;
  completeActiveSession(
    data: {
      id: string;
      exitAt: Date;
      durationMinutes: number;
      totalFeeMinorUnits: bigint;
      currency: string;
      feeBreakdown: Prisma.InputJsonValue;
    },
    tx: ParkingSessionTransactionClient,
  ): Promise<ParkingSession | null>;
}
