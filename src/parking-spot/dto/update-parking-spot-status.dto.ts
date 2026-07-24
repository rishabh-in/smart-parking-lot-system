import { ApiProperty } from '@nestjs/swagger';
import { ParkingSpotStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateParkingSpotStatusDto {
  @ApiProperty({
    enum: ParkingSpotStatus,
    example: ParkingSpotStatus.OUT_OF_SERVICE,
  })
  @IsEnum(ParkingSpotStatus)
  status!: ParkingSpotStatus;
}
