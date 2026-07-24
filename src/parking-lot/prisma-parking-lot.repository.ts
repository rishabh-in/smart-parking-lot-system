import { Injectable } from '@nestjs/common';
import { type ParkingLot, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ParkingLotRepository } from './parking-lot.repository';

@Injectable()
export class PrismaParkingLotRepository implements ParkingLotRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ParkingLotCreateInput): Promise<ParkingLot> {
    return this.prisma.parkingLot.create({ data });
  }

  findMany(): Promise<ParkingLot[]> {
    return this.prisma.parkingLot.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  findById(id: string): Promise<ParkingLot | null> {
    return this.prisma.parkingLot.findUnique({ where: { id } });
  }
}
