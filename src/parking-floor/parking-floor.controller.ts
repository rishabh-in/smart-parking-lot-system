import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateParkingFloorDto } from './dto/create-parking-floor.dto';
import { ParkingFloorService } from './parking-floor.service';

@ApiTags('Parking floors')
@Controller('parking-lots/:parkingLotId/floors')
export class ParkingFloorController {
  constructor(private readonly parkingFloors: ParkingFloorService) {}

  @Post()
  @ApiOperation({ summary: 'Create a parking floor' })
  @ApiCreatedResponse({ description: 'Parking floor created.' })
  @ApiNotFoundResponse({ description: 'Parking lot was not found.' })
  @ApiConflictResponse({
    description: 'Parking floor conflicts with existing data.',
  })
  create(
    @Param('parkingLotId', ParseUUIDPipe) parkingLotId: string,
    @Body() dto: CreateParkingFloorDto,
  ) {
    return this.parkingFloors.create(parkingLotId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List parking floors for a parking lot' })
  @ApiOkResponse({ description: 'Parking floors returned.' })
  @ApiNotFoundResponse({ description: 'Parking lot was not found.' })
  findByParkingLotId(
    @Param('parkingLotId', ParseUUIDPipe) parkingLotId: string,
  ) {
    return this.parkingFloors.findByParkingLotId(parkingLotId);
  }
}
