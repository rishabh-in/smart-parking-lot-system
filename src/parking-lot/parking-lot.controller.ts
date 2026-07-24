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
import { CreateParkingLotDto } from './dto/create-parking-lot.dto';
import { ParkingLotService } from './parking-lot.service';

@ApiTags('Parking lots')
@Controller('parking-lots')
export class ParkingLotController {
  constructor(private readonly parkingLots: ParkingLotService) {}

  @Post()
  @ApiOperation({ summary: 'Create a parking lot' })
  @ApiCreatedResponse({ description: 'Parking lot created.' })
  @ApiConflictResponse({
    description: 'Parking lot conflicts with existing data.',
  })
  create(@Body() dto: CreateParkingLotDto) {
    return this.parkingLots.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List parking lots' })
  @ApiOkResponse({ description: 'Parking lots returned.' })
  findMany() {
    return this.parkingLots.findMany();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a parking lot by id' })
  @ApiOkResponse({ description: 'Parking lot returned.' })
  @ApiNotFoundResponse({ description: 'Parking lot was not found.' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.parkingLots.findByIdOrThrow(id);
  }
}
