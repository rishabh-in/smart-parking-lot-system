import { ApiPropertyOptional } from '@nestjs/swagger';
import { ParkingSpotStatus, ParkingSpotType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListParkingSpotsQueryDto {
  @ApiPropertyOptional({ enum: ParkingSpotStatus })
  @IsOptional()
  @IsEnum(ParkingSpotStatus)
  status?: ParkingSpotStatus;

  @ApiPropertyOptional({ enum: ParkingSpotType })
  @IsOptional()
  @IsEnum(ParkingSpotType)
  type?: ParkingSpotType;
}
