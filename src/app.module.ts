import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AvailabilityModule } from './availability/availability.module';
import { validateEnvironment } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { ParkingAllocationModule } from './parking-allocation/parking-allocation.module';
import { ParkingFloorModule } from './parking-floor/parking-floor.module';
import { ParkingLotModule } from './parking-lot/parking-lot.module';
import { ParkingSpotModule } from './parking-spot/parking-spot.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    ParkingLotModule,
    ParkingFloorModule,
    ParkingSpotModule,
    ParkingAllocationModule,
    AvailabilityModule,
  ],
})
export class AppModule {}
