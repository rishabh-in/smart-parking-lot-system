import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckOutParkingSessionDto {
  @ApiPropertyOptional({ example: 'PK-20260724-ABC123DEF0' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ticketNumber?: string;

  @ApiPropertyOptional({ example: 'KA01AB1234' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  registrationNumber?: string;
}
