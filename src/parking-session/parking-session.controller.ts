import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CheckInParkingSessionDto } from './dto/check-in-parking-session.dto';
import { ParkingSessionService } from './parking-session.service';
import { type CheckInParkingSessionResponse } from './parking-session.service';

@ApiTags('Parking sessions')
@Controller('parking-sessions')
export class ParkingSessionController {
  constructor(private readonly parkingSessions: ParkingSessionService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check in a vehicle and assign a parking spot' })
  @ApiCreatedResponse({ description: 'Vehicle checked in.' })
  @ApiConflictResponse({
    description:
      'Vehicle is already checked in or no compatible spot is available.',
  })
  checkIn(
    @Body() dto: CheckInParkingSessionDto,
  ): Promise<CheckInParkingSessionResponse> {
    return this.parkingSessions.checkIn(dto);
  }
}
