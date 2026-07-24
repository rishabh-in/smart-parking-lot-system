import { Injectable } from '@nestjs/common';
import {
  type ParkingSpot,
  type ParkingSpotStatus,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ParkingSpotFilters,
  ParkingSpotRepository,
} from './parking-spot.repository';

@Injectable()
export class PrismaParkingSpotRepository implements ParkingSpotRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ParkingSpotUncheckedCreateInput): Promise<ParkingSpot> {
    return this.prisma.parkingSpot.create({ data });
  }

  createMany(
    data: Prisma.ParkingSpotUncheckedCreateInput[],
  ): Promise<ParkingSpot[]> {
    return this.prisma.$transaction(
      data.map((spot) => this.prisma.parkingSpot.create({ data: spot })),
    );
  }

  findByFloorId(floorId: string): Promise<ParkingSpot[]> {
    return this.prisma.parkingSpot.findMany({
      where: { floorId },
      orderBy: [{ priority: 'asc' }, { spotNumber: 'asc' }, { id: 'asc' }],
    });
  }

  findMany(filters: ParkingSpotFilters): Promise<ParkingSpot[]> {
    return this.prisma.parkingSpot.findMany({
      where: {
        status: filters.status,
        type: filters.type,
      },
      orderBy: [
        { floor: { sortOrder: 'asc' } },
        { priority: 'asc' },
        { spotNumber: 'asc' },
        { id: 'asc' },
      ],
    });
  }

  findById(id: string): Promise<ParkingSpot | null> {
    return this.prisma.parkingSpot.findUnique({ where: { id } });
  }

  updateStatus(id: string, status: ParkingSpotStatus): Promise<ParkingSpot> {
    return this.prisma.parkingSpot.update({
      where: { id },
      data: { status },
    });
  }
}
