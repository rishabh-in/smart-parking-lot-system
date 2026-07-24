import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BulkCreateParkingSpotsDto } from './dto/bulk-create-parking-spots.dto';
import { CreateParkingSpotDto } from './dto/create-parking-spot.dto';
import { ListParkingSpotsQueryDto } from './dto/list-parking-spots-query.dto';
import { UpdateParkingSpotStatusDto } from './dto/update-parking-spot-status.dto';
import { ParkingSpotService } from './parking-spot.service';

@ApiTags('Parking spots')
@Controller()
export class ParkingSpotController {
  constructor(private readonly parkingSpots: ParkingSpotService) {}

  @Post('parking-floors/:floorId/spots')
  @ApiOperation({ summary: 'Create a parking spot on a floor' })
  @ApiCreatedResponse({ description: 'Parking spot created.' })
  @ApiNotFoundResponse({ description: 'Parking floor was not found.' })
  @ApiConflictResponse({
    description: 'Parking spot conflicts with existing data.',
  })
  create(
    @Param('floorId', ParseUUIDPipe) floorId: string,
    @Body() dto: CreateParkingSpotDto,
  ) {
    return this.parkingSpots.create(floorId, dto);
  }

  @Post('parking-floors/:floorId/spots/bulk')
  @ApiOperation({ summary: 'Create parking spots on a floor in bulk' })
  @ApiCreatedResponse({ description: 'Parking spots created.' })
  @ApiNotFoundResponse({ description: 'Parking floor was not found.' })
  @ApiConflictResponse({ description: 'One or more parking spots conflict.' })
  createBulk(
    @Param('floorId', ParseUUIDPipe) floorId: string,
    @Body() dto: BulkCreateParkingSpotsDto,
  ) {
    return this.parkingSpots.createBulk(floorId, dto);
  }

  @Get('parking-floors/:floorId/spots')
  @ApiOperation({ summary: 'List parking spots on a floor' })
  @ApiOkResponse({ description: 'Parking spots returned.' })
  @ApiNotFoundResponse({ description: 'Parking floor was not found.' })
  findByFloorId(@Param('floorId', ParseUUIDPipe) floorId: string) {
    return this.parkingSpots.findByFloorId(floorId);
  }

  @Get('parking-spots')
  @ApiOperation({ summary: 'List parking spots with optional filters' })
  @ApiOkResponse({ description: 'Parking spots returned.' })
  findMany(@Query() query: ListParkingSpotsQueryDto) {
    return this.parkingSpots.findMany(query);
  }

  @Patch('parking-spots/:id/status')
  @ApiOperation({ summary: 'Update parking spot status' })
  @ApiOkResponse({ description: 'Parking spot status updated.' })
  @ApiNotFoundResponse({ description: 'Parking spot was not found.' })
  @ApiConflictResponse({
    description: 'Invalid parking spot status transition.',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParkingSpotStatusDto,
  ) {
    return this.parkingSpots.updateStatus(id, dto);
  }
}
