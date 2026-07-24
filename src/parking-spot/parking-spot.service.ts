import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ParkingSpotStatus, type ParkingSpot } from '@prisma/client';
import { ApplicationError } from '../common/errors/application-error';
import { ErrorCode } from '../common/errors/error-code';
import { isPrismaErrorCode } from '../common/prisma/prisma-error.util';
import { ParkingFloorService } from '../parking-floor/parking-floor.service';
import { BulkCreateParkingSpotsDto } from './dto/bulk-create-parking-spots.dto';
import { CreateParkingSpotDto } from './dto/create-parking-spot.dto';
import { ListParkingSpotsQueryDto } from './dto/list-parking-spots-query.dto';
import { UpdateParkingSpotStatusDto } from './dto/update-parking-spot-status.dto';
import { ParkingSpotStatusTransitionPolicy } from './domain/parking-spot-status-transition.policy';
import { PARKING_SPOT_REPOSITORY } from './parking-spot.repository';
import { type ParkingSpotRepository } from './parking-spot.repository';

@Injectable()
export class ParkingSpotService {
  constructor(
    @Inject(PARKING_SPOT_REPOSITORY)
    private readonly parkingSpots: ParkingSpotRepository,
    private readonly parkingFloors: ParkingFloorService,
    private readonly statusTransitions: ParkingSpotStatusTransitionPolicy,
  ) {}

  async create(
    floorId: string,
    dto: CreateParkingSpotDto,
  ): Promise<ParkingSpot> {
    await this.parkingFloors.findByIdOrThrow(floorId);

    try {
      return await this.parkingSpots.create({
        floorId,
        spotNumber: dto.spotNumber,
        type: dto.type,
        status: dto.status ?? ParkingSpotStatus.AVAILABLE,
        priority: dto.priority ?? 0,
        isActive: dto.isActive ?? true,
      });
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  async createBulk(
    floorId: string,
    dto: BulkCreateParkingSpotsDto,
  ): Promise<ParkingSpot[]> {
    await this.parkingFloors.findByIdOrThrow(floorId);

    try {
      return await this.parkingSpots.createMany(
        dto.spots.map((spot) => ({
          floorId,
          spotNumber: spot.spotNumber,
          type: spot.type,
          status: spot.status ?? ParkingSpotStatus.AVAILABLE,
          priority: spot.priority ?? 0,
          isActive: spot.isActive ?? true,
        })),
      );
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  async findByFloorId(floorId: string): Promise<ParkingSpot[]> {
    await this.parkingFloors.findByIdOrThrow(floorId);

    return this.parkingSpots.findByFloorId(floorId);
  }

  findMany(filters: ListParkingSpotsQueryDto): Promise<ParkingSpot[]> {
    return this.parkingSpots.findMany(filters);
  }

  async updateStatus(
    id: string,
    dto: UpdateParkingSpotStatusDto,
  ): Promise<ParkingSpot> {
    const spot = await this.findByIdOrThrow(id);

    this.statusTransitions.assertCanTransition(spot.status, dto.status);

    return this.parkingSpots.updateStatus(id, dto.status);
  }

  private async findByIdOrThrow(id: string): Promise<ParkingSpot> {
    const parkingSpot = await this.parkingSpots.findById(id);

    if (!parkingSpot) {
      throw new ApplicationError(
        ErrorCode.PARKING_SPOT_NOT_FOUND,
        'Parking spot was not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return parkingSpot;
  }

  private handleWriteError(error: unknown): never {
    if (isPrismaErrorCode(error, 'P2002')) {
      throw new ApplicationError(
        ErrorCode.PARKING_SPOT_CONFLICT,
        'Parking spot conflicts with an existing spot on this floor',
        HttpStatus.CONFLICT,
      );
    }

    throw error;
  }
}
