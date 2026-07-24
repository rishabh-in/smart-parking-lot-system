import { Injectable } from '@nestjs/common';
import { type Prisma, type Vehicle } from '@prisma/client';
import {
  VehicleRepository,
  type VehicleTransactionClient,
} from './vehicle.repository';

@Injectable()
export class PrismaVehicleRepository implements VehicleRepository {
  findByRegistrationNumber(
    registrationNumber: string,
    tx: VehicleTransactionClient,
  ): Promise<Vehicle | null> {
    return tx.vehicle.findUnique({ where: { registrationNumber } });
  }

  create(
    data: Prisma.VehicleUncheckedCreateInput,
    tx: VehicleTransactionClient,
  ): Promise<Vehicle> {
    return tx.vehicle.create({ data });
  }
}
