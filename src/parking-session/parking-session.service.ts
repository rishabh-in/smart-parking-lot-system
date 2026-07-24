import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import {
  ParkingSessionStatus,
  ParkingSpotStatus,
  Prisma,
  type ParkingSession,
} from '@prisma/client';
import { ApplicationError } from '../common/errors/application-error';
import { ErrorCode } from '../common/errors/error-code';
import { isPrismaErrorCode } from '../common/prisma/prisma-error.util';
import { CLOCK, type Clock } from '../common/time/clock';
import { ParkingAllocationService } from '../parking-allocation/parking-allocation.service';
import { AllocatedParkingSpot } from '../parking-allocation/parking-allocation.types';
import { PrismaService } from '../prisma/prisma.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { CheckInParkingSessionDto } from './dto/check-in-parking-session.dto';
import { ParkingTicketNumberGenerator } from './parking-ticket-number.generator';
import { PARKING_SESSION_REPOSITORY } from './parking-session.repository';
import {
  type ParkingSessionRepository,
  type ParkingSessionTransactionClient,
} from './parking-session.repository';

export interface CheckInParkingSessionResponse {
  ticketNumber: string;
  registrationNumber: string;
  vehicleType: string;
  entryAt: Date;
  sessionStatus: ParkingSessionStatus;
  assignedSpot: {
    id: string;
    spotNumber: string;
    type: string;
    status: ParkingSpotStatus;
    floorId: string;
    floorName: string;
    floorNumber: number;
    parkingLotId: string;
  };
}

@Injectable()
export class ParkingSessionService {
  private readonly logger = new Logger(ParkingSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicles: VehicleService,
    private readonly allocation: ParkingAllocationService,
    private readonly ticketNumbers: ParkingTicketNumberGenerator,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(PARKING_SESSION_REPOSITORY)
    private readonly parkingSessions: ParkingSessionRepository,
  ) {}

  checkIn(
    dto: CheckInParkingSessionDto,
  ): Promise<CheckInParkingSessionResponse> {
    const registrationNumber = this.vehicles.normalizeRegistrationNumber(
      dto.registrationNumber,
    );

    this.logger.log({
      message: 'Check-in started',
      registrationNumber,
      vehicleType: dto.vehicleType,
      parkingLotId: dto.parkingLotId,
    });

    return this.prisma.$transaction(
      async (tx) => {
        const vehicle = await this.vehicles.findOrCreateVehicle(
          registrationNumber,
          dto.vehicleType,
          tx,
        );

        const activeSession = await this.parkingSessions.findActiveByVehicleId(
          vehicle.id,
          tx,
        );

        if (activeSession) {
          throw new ApplicationError(
            ErrorCode.VEHICLE_ALREADY_CHECKED_IN,
            'The vehicle already has an active parking session',
            HttpStatus.CONFLICT,
          );
        }

        const allocatedSpot = await this.allocation.reserveCompatibleSpot(
          {
            vehicleType: dto.vehicleType,
            parkingLotId: dto.parkingLotId,
          },
          tx,
        );
        const entryAt = this.clock.now();
        const ticketNumber = this.ticketNumbers.generate(entryAt);
        const session = await this.createActiveSession(
          {
            ticketNumber,
            vehicleId: vehicle.id,
            parkingSpotId: allocatedSpot.id,
            entryAt,
          },
          tx,
        );

        await this.parkingSessions.updateSpotStatus(
          allocatedSpot.id,
          ParkingSpotStatus.OCCUPIED,
          tx,
        );

        this.logger.log({
          message: 'Check-in completed',
          registrationNumber,
          ticketNumber,
          parkingSpotId: allocatedSpot.id,
        });

        return this.toCheckInResponse(
          session,
          registrationNumber,
          dto.vehicleType,
          allocatedSpot,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  private async createActiveSession(
    data: {
      ticketNumber: string;
      vehicleId: string;
      parkingSpotId: string;
      entryAt: Date;
    },
    tx: ParkingSessionTransactionClient,
  ): Promise<ParkingSession> {
    try {
      return await this.parkingSessions.create(
        {
          ...data,
          status: ParkingSessionStatus.ACTIVE,
        },
        tx,
      );
    } catch (error: unknown) {
      if (isPrismaErrorCode(error, 'P2002')) {
        throw new ApplicationError(
          ErrorCode.PARKING_SESSION_CONFLICT,
          'Parking session conflicts with an existing active session or ticket',
          HttpStatus.CONFLICT,
        );
      }

      throw error;
    }
  }

  private toCheckInResponse(
    session: ParkingSession,
    registrationNumber: string,
    vehicleType: string,
    allocatedSpot: AllocatedParkingSpot,
  ): CheckInParkingSessionResponse {
    return {
      ticketNumber: session.ticketNumber,
      registrationNumber,
      vehicleType,
      entryAt: session.entryAt,
      sessionStatus: session.status,
      assignedSpot: {
        id: allocatedSpot.id,
        spotNumber: allocatedSpot.spotNumber,
        type: allocatedSpot.type,
        status: ParkingSpotStatus.OCCUPIED,
        floorId: allocatedSpot.floorId,
        floorName: allocatedSpot.floorName,
        floorNumber: allocatedSpot.floorNumber,
        parkingLotId: allocatedSpot.parkingLotId,
      },
    };
  }
}
