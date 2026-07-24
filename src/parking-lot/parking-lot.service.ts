import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type ParkingLot } from '@prisma/client';
import { ApplicationError } from '../common/errors/application-error';
import { ErrorCode } from '../common/errors/error-code';
import { isPrismaErrorCode } from '../common/prisma/prisma-error.util';
import { CreateParkingLotDto } from './dto/create-parking-lot.dto';
import { PARKING_LOT_REPOSITORY } from './parking-lot.repository';
import { type ParkingLotRepository } from './parking-lot.repository';

@Injectable()
export class ParkingLotService {
  constructor(
    @Inject(PARKING_LOT_REPOSITORY)
    private readonly parkingLots: ParkingLotRepository,
  ) {}

  async create(dto: CreateParkingLotDto): Promise<ParkingLot> {
    try {
      return await this.parkingLots.create({
        name: dto.name,
        address: dto.address,
        description: dto.description,
        timezone: dto.timezone ?? 'Asia/Kolkata',
      });
    } catch (error: unknown) {
      if (isPrismaErrorCode(error, 'P2002')) {
        throw new ApplicationError(
          ErrorCode.PARKING_LOT_CONFLICT,
          'Parking lot conflicts with an existing record',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
  }

  findMany(): Promise<ParkingLot[]> {
    return this.parkingLots.findMany();
  }

  async findByIdOrThrow(id: string): Promise<ParkingLot> {
    const parkingLot = await this.parkingLots.findById(id);

    if (!parkingLot) {
      throw new ApplicationError(
        ErrorCode.PARKING_LOT_NOT_FOUND,
        'Parking lot was not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return parkingLot;
  }
}
