import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ParkingLotController } from './parking-lot.controller';
import { PARKING_LOT_REPOSITORY } from './parking-lot.repository';
import { ParkingLotService } from './parking-lot.service';
import { PrismaParkingLotRepository } from './prisma-parking-lot.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ParkingLotController],
  providers: [
    ParkingLotService,
    {
      provide: PARKING_LOT_REPOSITORY,
      useClass: PrismaParkingLotRepository,
    },
  ],
  exports: [ParkingLotService],
})
export class ParkingLotModule {}
