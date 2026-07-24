import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';
import { CreateParkingSpotDto } from './create-parking-spot.dto';

export class BulkCreateParkingSpotsDto {
  @ApiProperty({ type: [CreateParkingSpotDto] })
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateParkingSpotDto)
  spots!: CreateParkingSpotDto[];
}
