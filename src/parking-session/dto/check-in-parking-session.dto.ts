import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CheckInParkingSessionDto {
  @ApiProperty({ example: 'KA01AB1234' })
  @IsString()
  @MaxLength(32)
  registrationNumber!: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.CAR })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiPropertyOptional({
    example: '11111111-1111-4111-8111-111111111111',
  })
  @IsOptional()
  @IsUUID()
  parkingLotId?: string;
}
