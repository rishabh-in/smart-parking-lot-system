import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpotAllocationOrderingPolicy } from './domain/spot-allocation-ordering.policy';
import { SpotCompatibilityPolicy } from './domain/spot-compatibility.policy';
import { PARKING_ALLOCATION_REPOSITORY } from './parking-allocation.repository';
import { ParkingAllocationService } from './parking-allocation.service';
import { PrismaParkingAllocationRepository } from './prisma-parking-allocation.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    ParkingAllocationService,
    SpotCompatibilityPolicy,
    SpotAllocationOrderingPolicy,
    {
      provide: PARKING_ALLOCATION_REPOSITORY,
      useClass: PrismaParkingAllocationRepository,
    },
  ],
  exports: [
    ParkingAllocationService,
    SpotCompatibilityPolicy,
    SpotAllocationOrderingPolicy,
  ],
})
export class ParkingAllocationModule {}
