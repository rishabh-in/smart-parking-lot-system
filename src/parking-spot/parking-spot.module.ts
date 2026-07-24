import { Module } from '@nestjs/common';
import { ParkingFloorModule } from '../parking-floor/parking-floor.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ParkingSpotStatusTransitionPolicy } from './domain/parking-spot-status-transition.policy';
import { ParkingSpotController } from './parking-spot.controller';
import { PARKING_SPOT_REPOSITORY } from './parking-spot.repository';
import { ParkingSpotService } from './parking-spot.service';
import { PrismaParkingSpotRepository } from './prisma-parking-spot.repository';

@Module({
  imports: [PrismaModule, ParkingFloorModule],
  controllers: [ParkingSpotController],
  providers: [
    ParkingSpotService,
    ParkingSpotStatusTransitionPolicy,
    {
      provide: PARKING_SPOT_REPOSITORY,
      useClass: PrismaParkingSpotRepository,
    },
  ],
  exports: [ParkingSpotService],
})
export class ParkingSpotModule {}
