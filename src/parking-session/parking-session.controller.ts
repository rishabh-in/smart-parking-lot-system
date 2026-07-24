import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CheckInParkingSessionDto } from './dto/check-in-parking-session.dto';
import { CheckOutParkingSessionDto } from './dto/check-out-parking-session.dto';
import { ParkingSessionService } from './parking-session.service';
import {
  type CheckInParkingSessionResponse,
  type CheckOutParkingSessionResponse,
} from './parking-session.service';

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

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check out a vehicle and calculate parking fee' })
  @ApiOkResponse({ description: 'Vehicle checked out.' })
  @ApiNotFoundResponse({ description: 'Active parking session was not found.' })
  @ApiConflictResponse({
    description: 'Parking session was already completed.',
  })
  checkOut(
    @Body() dto: CheckOutParkingSessionDto,
  ): Promise<CheckOutParkingSessionResponse> {
    return this.parkingSessions.checkOut(dto);
  }
}
