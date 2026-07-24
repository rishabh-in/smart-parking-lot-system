import { HttpStatus, Injectable } from '@nestjs/common';
import { ParkingSpotStatus, ParkingSpotType } from '@prisma/client';
import { ApplicationError } from '../common/errors/application-error';
import { ErrorCode } from '../common/errors/error-code';
import { PrismaService } from '../prisma/prisma.service';

export interface AvailabilityCount {
  type: ParkingSpotType;
  status: ParkingSpotStatus;
  count: number;
}

export interface FloorAvailability {
  floorId: string;
  floorNumber: number;
  floorName: string;
  counts: AvailabilityCount[];
}

export interface ParkingLotAvailability {
  parkingLotId: string;
  floors: FloorAvailability[];
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getParkingLotAvailability(
    parkingLotId: string,
  ): Promise<ParkingLotAvailability> {
    const parkingLot = await this.prisma.parkingLot.findUnique({
      where: { id: parkingLotId },
      select: { id: true },
    });

    if (!parkingLot) {
      throw new ApplicationError(
        ErrorCode.PARKING_LOT_NOT_FOUND,
        'Parking lot was not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const [floors, groupedCounts] = await Promise.all([
      this.prisma.parkingFloor.findMany({
        where: { parkingLotId },
        orderBy: [{ sortOrder: 'asc' }, { floorNumber: 'asc' }, { id: 'asc' }],
        select: { id: true, floorNumber: true, name: true },
      }),
      this.prisma.parkingSpot.groupBy({
        by: ['floorId', 'type', 'status'],
        where: {
          isActive: true,
          floor: { parkingLotId },
        },
        _count: { _all: true },
      }),
    ]);

    return {
      parkingLotId,
      floors: floors.map((floor) => ({
        floorId: floor.id,
        floorNumber: floor.floorNumber,
        floorName: floor.name,
        counts: groupedCounts
          .filter((count) => count.floorId === floor.id)
          .map((count) => ({
            type: count.type,
            status: count.status,
            count: count._count._all,
          })),
      })),
    };
  }
}
