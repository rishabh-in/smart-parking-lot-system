import { Module } from '@nestjs/common';
import { ParkingLotModule } from '../parking-lot/parking-lot.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ParkingFloorController } from './parking-floor.controller';
import { PARKING_FLOOR_REPOSITORY } from './parking-floor.repository';
import { ParkingFloorService } from './parking-floor.service';
import { PrismaParkingFloorRepository } from './prisma-parking-floor.repository';

@Module({
  imports: [PrismaModule, ParkingLotModule],
  controllers: [ParkingFloorController],
  providers: [
    ParkingFloorService,
    {
      provide: PARKING_FLOOR_REPOSITORY,
      useClass: PrismaParkingFloorRepository,
    },
  ],
  exports: [ParkingFloorService],
})
export class ParkingFloorModule {}
