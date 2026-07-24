import { Injectable } from '@nestjs/common';
import {
  ParkingSessionStatus,
  ParkingSpotStatus,
  type ParkingSession,
  type Prisma,
} from '@prisma/client';
import {
  ParkingSessionRepository,
  type ParkingSessionTransactionClient,
} from './parking-session.repository';

@Injectable()
export class PrismaParkingSessionRepository implements ParkingSessionRepository {
  findActiveByVehicleId(
    vehicleId: string,
    tx: ParkingSessionTransactionClient,
  ): Promise<ParkingSession | null> {
    return tx.parkingSession.findFirst({
      where: { vehicleId, status: ParkingSessionStatus.ACTIVE },
    });
  }

  create(
    data: Prisma.ParkingSessionUncheckedCreateInput,
    tx: ParkingSessionTransactionClient,
  ): Promise<ParkingSession> {
    return tx.parkingSession.create({ data });
  }

  async updateSpotStatus(
    parkingSpotId: string,
    status: ParkingSpotStatus,
    tx: ParkingSessionTransactionClient,
  ): Promise<void> {
    await tx.parkingSpot.update({
      where: { id: parkingSpotId },
      data: { status },
    });
  }
}
