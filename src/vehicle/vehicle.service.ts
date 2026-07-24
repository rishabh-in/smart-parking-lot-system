import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type Vehicle, type VehicleType } from '@prisma/client';
import { ApplicationError } from '../common/errors/application-error';
import { ErrorCode } from '../common/errors/error-code';
import { isPrismaErrorCode } from '../common/prisma/prisma-error.util';
import { VehicleRegistrationNormalizer } from './domain/vehicle-registration-normalizer';
import { VEHICLE_REPOSITORY } from './vehicle.repository';
import {
  type VehicleRepository,
  type VehicleTransactionClient,
} from './vehicle.repository';

@Injectable()
export class VehicleService {
  constructor(
    private readonly registrationNormalizer: VehicleRegistrationNormalizer,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicles: VehicleRepository,
  ) {}

  normalizeRegistrationNumber(registrationNumber: string): string {
    return this.registrationNormalizer.normalize(registrationNumber);
  }

  async findOrCreateVehicle(
    registrationNumber: string,
    vehicleType: VehicleType,
    tx: VehicleTransactionClient,
  ): Promise<Vehicle> {
    const existingVehicle = await this.vehicles.findByRegistrationNumber(
      registrationNumber,
      tx,
    );

    if (existingVehicle) {
      if (existingVehicle.vehicleType !== vehicleType) {
        throw new ApplicationError(
          ErrorCode.VEHICLE_TYPE_CONFLICT,
          'Vehicle registration number already exists with a different vehicle type',
          HttpStatus.CONFLICT,
        );
      }

      return existingVehicle;
    }

    try {
      return await this.vehicles.create(
        {
          registrationNumber,
          vehicleType,
        },
        tx,
      );
    } catch (error: unknown) {
      if (isPrismaErrorCode(error, 'P2002')) {
        throw new ApplicationError(
          ErrorCode.VEHICLE_REGISTRATION_CONFLICT,
          'Vehicle registration number already exists',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
  }
}
