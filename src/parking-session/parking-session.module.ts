import { Module } from '@nestjs/common';
import { CLOCK, SystemClock } from '../common/time/clock';
import { ParkingAllocationModule } from '../parking-allocation/parking-allocation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { ParkingSessionController } from './parking-session.controller';
import { ParkingTicketNumberGenerator } from './parking-ticket-number.generator';
import { PARKING_SESSION_REPOSITORY } from './parking-session.repository';
import { ParkingSessionService } from './parking-session.service';
import { PrismaParkingSessionRepository } from './prisma-parking-session.repository';

@Module({
  imports: [PrismaModule, VehicleModule, ParkingAllocationModule],
  controllers: [ParkingSessionController],
  providers: [
    ParkingSessionService,
    ParkingTicketNumberGenerator,
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
    {
      provide: PARKING_SESSION_REPOSITORY,
      useClass: PrismaParkingSessionRepository,
    },
  ],
})
export class ParkingSessionModule {}
