import { Injectable } from '@nestjs/common';
import { type ParkingFloor, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ParkingFloorRepository } from './parking-floor.repository';

@Injectable()
export class PrismaParkingFloorRepository implements ParkingFloorRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ParkingFloorUncheckedCreateInput): Promise<ParkingFloor> {
    return this.prisma.parkingFloor.create({ data });
  }

  findByParkingLotId(parkingLotId: string): Promise<ParkingFloor[]> {
    return this.prisma.parkingFloor.findMany({
      where: { parkingLotId },
      orderBy: [{ sortOrder: 'asc' }, { floorNumber: 'asc' }, { id: 'asc' }],
    });
  }

  findById(id: string): Promise<ParkingFloor | null> {
    return this.prisma.parkingFloor.findUnique({ where: { id } });
  }
}
