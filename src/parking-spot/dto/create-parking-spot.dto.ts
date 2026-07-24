import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParkingSpotStatus, ParkingSpotType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateParkingSpotDto {
  @ApiProperty({ example: 'F1-C-01' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  spotNumber!: string;

  @ApiProperty({ enum: ParkingSpotType, example: ParkingSpotType.COMPACT })
  @IsEnum(ParkingSpotType)
  type!: ParkingSpotType;

  @ApiPropertyOptional({
    enum: ParkingSpotStatus,
    default: ParkingSpotStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(ParkingSpotStatus)
  status?: ParkingSpotStatus;

  @ApiPropertyOptional({ example: 101, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
