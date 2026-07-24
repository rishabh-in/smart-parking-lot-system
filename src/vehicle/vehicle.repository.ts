import { type Prisma, type Vehicle } from '@prisma/client';

export const VEHICLE_REPOSITORY = Symbol('VEHICLE_REPOSITORY');

export type VehicleTransactionClient = Pick<
  Prisma.TransactionClient,
  'vehicle'
>;

export interface VehicleRepository {
  findByRegistrationNumber(
    registrationNumber: string,
    tx: VehicleTransactionClient,
  ): Promise<Vehicle | null>;
  create(
    data: Prisma.VehicleUncheckedCreateInput,
    tx: VehicleTransactionClient,
  ): Promise<Vehicle>;
}
