import { Injectable } from '@nestjs/common';
import { ParkingSpotStatus, ParkingSpotType, Prisma } from '@prisma/client';
import { SpotCompatibilityPolicy } from './domain/spot-compatibility.policy';
import {
  AllocationTransactionClient,
  ParkingAllocationRepository,
} from './parking-allocation.repository';
import {
  AllocatedParkingSpot,
  AllocateParkingSpotInput,
} from './parking-allocation.types';

interface ReservedParkingSpotRow {
  id: string;
  floor_id: string;
  parking_lot_id: string;
  spot_number: string;
  type: ParkingSpotType;
  status: ParkingSpotStatus;
  priority: number;
  floor_name: string;
  floor_number: number;
  floor_sort_order: number;
}

@Injectable()
export class PrismaParkingAllocationRepository implements ParkingAllocationRepository {
  constructor(private readonly compatibility: SpotCompatibilityPolicy) {}

  async findAndReserveSpot(
    input: AllocateParkingSpotInput,
    tx: AllocationTransactionClient,
  ): Promise<AllocatedParkingSpot | null> {
    const compatibleTypes = this.compatibility.getCompatibleSpotTypes(
      input.vehicleType,
    );

    const rows = await tx.$queryRaw<ReservedParkingSpotRow[]>(
      this.buildReservationQuery(input, compatibleTypes),
    );
    const [reservedSpot] = rows;

    return reservedSpot ? this.toAllocatedParkingSpot(reservedSpot) : null;
  }

  private buildReservationQuery(
    input: AllocateParkingSpotInput,
    compatibleTypes: ParkingSpotType[],
  ): Prisma.Sql {
    const parkingLotFilter = input.parkingLotId
      ? Prisma.sql`AND pf.parking_lot_id = ${input.parkingLotId}::uuid`
      : Prisma.empty;

    return Prisma.sql`
      WITH candidate AS (
        SELECT ps.id
        FROM "parking_spots" ps
        INNER JOIN "parking_floors" pf ON pf.id = ps.floor_id
        INNER JOIN "parking_lots" pl ON pl.id = pf.parking_lot_id
        WHERE ps.status = 'AVAILABLE'::"ParkingSpotStatus"
          AND ps.is_active = true
          AND pf.is_active = true
          AND pl.is_active = true
          ${parkingLotFilter}
          AND ps.type IN (${this.toSpotTypeSqlList(compatibleTypes)})
        ORDER BY
          ${this.toSpotTypeRankSql(compatibleTypes)},
          pf.sort_order ASC,
          ps.priority ASC,
          ps.spot_number ASC,
          ps.id ASC
        FOR UPDATE OF ps SKIP LOCKED
        LIMIT 1
      )
      UPDATE "parking_spots" ps
      SET
        "status" = 'RESERVED'::"ParkingSpotStatus",
        "updated_at" = CURRENT_TIMESTAMP
      FROM candidate, "parking_floors" pf
      WHERE ps.id = candidate.id
        AND pf.id = ps.floor_id
      RETURNING
        ps.id,
        ps.floor_id,
        pf.parking_lot_id,
        ps.spot_number,
        ps.type,
        ps.status,
        ps.priority,
        pf.name AS floor_name,
        pf.floor_number,
        pf.sort_order AS floor_sort_order
    `;
  }

  private toSpotTypeSqlList(spotTypes: ParkingSpotType[]): Prisma.Sql {
    return Prisma.join(
      spotTypes.map((spotType) => Prisma.sql`${spotType}::"ParkingSpotType"`),
    );
  }

  private toSpotTypeRankSql(spotTypes: ParkingSpotType[]): Prisma.Sql {
    const rankCases = spotTypes.map(
      (spotType, index) =>
        Prisma.sql`WHEN ${spotType}::"ParkingSpotType" THEN ${index}`,
    );

    return Prisma.sql`CASE ps.type ${Prisma.join(rankCases, ' ')} ELSE 999 END`;
  }

  private toAllocatedParkingSpot(
    row: ReservedParkingSpotRow,
  ): AllocatedParkingSpot {
    return {
      id: row.id,
      floorId: row.floor_id,
      parkingLotId: row.parking_lot_id,
      spotNumber: row.spot_number,
      type: row.type,
      status: row.status,
      priority: row.priority,
      floorName: row.floor_name,
      floorNumber: row.floor_number,
      floorSortOrder: row.floor_sort_order,
    };
  }
}
