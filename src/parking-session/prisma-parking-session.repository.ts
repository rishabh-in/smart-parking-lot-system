import { Injectable } from '@nestjs/common';
import {
  ParkingSessionStatus,
  ParkingSpotStatus,
  ParkingSpotType,
  Prisma,
  VehicleType,
  type ParkingSession,
} from '@prisma/client';
import {
  ActiveParkingSessionForCheckout,
  ParkingSessionRepository,
  type ParkingSessionTransactionClient,
} from './parking-session.repository';

interface ActiveParkingSessionForCheckoutRow {
  id: string;
  ticket_number: string;
  vehicle_id: string;
  registration_number: string;
  vehicle_type: VehicleType;
  parking_spot_id: string;
  parking_spot_number: string;
  parking_spot_type: ParkingSpotType;
  parking_spot_status: ParkingSpotStatus;
  floor_id: string;
  floor_name: string;
  floor_number: number;
  parking_lot_id: string;
  entry_at: Date;
  status: ParkingSessionStatus;
}

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

  async findActiveForCheckout(
    input: { ticketNumber?: string; registrationNumber?: string },
    tx: ParkingSessionTransactionClient,
  ): Promise<ActiveParkingSessionForCheckout | null> {
    const filter = input.ticketNumber
      ? Prisma.sql`s.ticket_number = ${input.ticketNumber}`
      : Prisma.sql`v.registration_number = ${input.registrationNumber}`;
    const rows = await tx.$queryRaw<ActiveParkingSessionForCheckoutRow[]>`
      SELECT
        s.id,
        s.ticket_number,
        s.vehicle_id,
        v.registration_number,
        v.vehicle_type,
        s.parking_spot_id,
        ps.spot_number AS parking_spot_number,
        ps.type AS parking_spot_type,
        ps.status AS parking_spot_status,
        pf.id AS floor_id,
        pf.name AS floor_name,
        pf.floor_number,
        pf.parking_lot_id,
        s.entry_at,
        s.status
      FROM "parking_sessions" s
      INNER JOIN "vehicles" v ON v.id = s.vehicle_id
      INNER JOIN "parking_spots" ps ON ps.id = s.parking_spot_id
      INNER JOIN "parking_floors" pf ON pf.id = ps.floor_id
      WHERE s.status = 'ACTIVE'::"ParkingSessionStatus"
        AND ${filter}
      FOR UPDATE OF s
      LIMIT 1
    `;
    const [row] = rows;

    return row ? this.toActiveSessionForCheckout(row) : null;
  }

  async completeActiveSession(
    data: {
      id: string;
      exitAt: Date;
      durationMinutes: number;
      totalFeeMinorUnits: bigint;
      currency: string;
      feeBreakdown: Prisma.InputJsonValue;
    },
    tx: ParkingSessionTransactionClient,
  ): Promise<ParkingSession | null> {
    const updateResult = await tx.parkingSession.updateMany({
      where: { id: data.id, status: ParkingSessionStatus.ACTIVE },
      data: {
        exitAt: data.exitAt,
        status: ParkingSessionStatus.COMPLETED,
        durationMinutes: data.durationMinutes,
        totalFeeMinorUnits: data.totalFeeMinorUnits,
        currency: data.currency,
        feeBreakdown: data.feeBreakdown,
      },
    });

    if (updateResult.count !== 1) {
      return null;
    }

    return tx.parkingSession.findUniqueOrThrow({ where: { id: data.id } });
  }

  private toActiveSessionForCheckout(
    row: ActiveParkingSessionForCheckoutRow,
  ): ActiveParkingSessionForCheckout {
    return {
      id: row.id,
      ticketNumber: row.ticket_number,
      vehicleId: row.vehicle_id,
      registrationNumber: row.registration_number,
      vehicleType: row.vehicle_type,
      parkingSpotId: row.parking_spot_id,
      parkingSpotNumber: row.parking_spot_number,
      parkingSpotType: row.parking_spot_type,
      parkingSpotStatus: row.parking_spot_status,
      floorId: row.floor_id,
      floorName: row.floor_name,
      floorNumber: row.floor_number,
      parkingLotId: row.parking_lot_id,
      entryAt: row.entry_at,
      status: row.status,
    };
  }
}
