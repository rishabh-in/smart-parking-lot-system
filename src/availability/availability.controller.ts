import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { type ParkingLotAvailability } from './availability.service';

@ApiTags('Availability')
@Controller('parking-lots/:parkingLotId/availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get parking lot availability grouped by floor, spot type, and status',
  })
  @ApiOkResponse({ description: 'Parking lot availability returned.' })
  @ApiNotFoundResponse({ description: 'Parking lot was not found.' })
  getParkingLotAvailability(
    @Param('parkingLotId', ParseUUIDPipe) parkingLotId: string,
  ): Promise<ParkingLotAvailability> {
    return this.availability.getParkingLotAvailability(parkingLotId);
  }
}
