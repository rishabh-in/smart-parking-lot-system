import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type ParkingFloor } from '@prisma/client';
import { ApplicationError } from '../common/errors/application-error';
import { ErrorCode } from '../common/errors/error-code';
import { isPrismaErrorCode } from '../common/prisma/prisma-error.util';
import { ParkingLotService } from '../parking-lot/parking-lot.service';
import { CreateParkingFloorDto } from './dto/create-parking-floor.dto';
import { PARKING_FLOOR_REPOSITORY } from './parking-floor.repository';
import { type ParkingFloorRepository } from './parking-floor.repository';

@Injectable()
export class ParkingFloorService {
  constructor(
    @Inject(PARKING_FLOOR_REPOSITORY)
    private readonly parkingFloors: ParkingFloorRepository,
    private readonly parkingLots: ParkingLotService,
  ) {}

  async create(
    parkingLotId: string,
    dto: CreateParkingFloorDto,
  ): Promise<ParkingFloor> {
    await this.parkingLots.findByIdOrThrow(parkingLotId);

    try {
      return await this.parkingFloors.create({
        parkingLotId,
        name: dto.name,
        floorNumber: dto.floorNumber,
        description: dto.description,
        sortOrder: dto.sortOrder ?? dto.floorNumber,
      });
    } catch (error: unknown) {
      if (isPrismaErrorCode(error, 'P2002')) {
        throw new ApplicationError(
          ErrorCode.PARKING_FLOOR_CONFLICT,
          'Parking floor conflicts with an existing floor in this parking lot',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
  }

  async findByParkingLotId(parkingLotId: string): Promise<ParkingFloor[]> {
    await this.parkingLots.findByIdOrThrow(parkingLotId);

    return this.parkingFloors.findByParkingLotId(parkingLotId);
  }

  async findByIdOrThrow(id: string): Promise<ParkingFloor> {
    const parkingFloor = await this.parkingFloors.findById(id);

    if (!parkingFloor) {
      throw new ApplicationError(
        ErrorCode.PARKING_FLOOR_NOT_FOUND,
        'Parking floor was not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return parkingFloor;
  }
}
