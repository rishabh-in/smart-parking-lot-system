import { Module } from '@nestjs/common';
import { VehicleRegistrationNormalizer } from './domain/vehicle-registration-normalizer';
import { PrismaVehicleRepository } from './prisma-vehicle.repository';
import { VEHICLE_REPOSITORY } from './vehicle.repository';
import { VehicleService } from './vehicle.service';

@Module({
  providers: [
    VehicleService,
    VehicleRegistrationNormalizer,
    {
      provide: VEHICLE_REPOSITORY,
      useClass: PrismaVehicleRepository,
    },
  ],
  exports: [VehicleService],
})
export class VehicleModule {}
