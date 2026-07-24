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
import { FeeCalculationService } from '../fee-calculation/fee-calculation.service';
import { FeeBreakdown } from '../fee-calculation/fee-calculation.types';
import { ParkingAllocationService } from '../parking-allocation/parking-allocation.service';
import { AllocatedParkingSpot } from '../parking-allocation/parking-allocation.types';
import { PrismaService } from '../prisma/prisma.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { CheckInParkingSessionDto } from './dto/check-in-parking-session.dto';
import { CheckOutParkingSessionDto } from './dto/check-out-parking-session.dto';
import { ParkingTicketNumberGenerator } from './parking-ticket-number.generator';
import { PARKING_SESSION_REPOSITORY } from './parking-session.repository';
import {
  ActiveParkingSessionForCheckout,
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

export interface CheckOutParkingSessionResponse {
  ticketNumber: string;
  registrationNumber: string;
  vehicleType: string;
  entryAt: Date;
  exitAt: Date;
  sessionStatus: ParkingSessionStatus;
  durationMinutes: number;
  totalFeeMinorUnits: string;
  currency: string;
  feeBreakdown: FeeBreakdown;
  releasedSpot: {
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
    private readonly fees: FeeCalculationService,
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

  checkOut(
    dto: CheckOutParkingSessionDto,
  ): Promise<CheckOutParkingSessionResponse> {
    const checkoutLookup = this.toCheckoutLookup(dto);

    this.logger.log({
      message: 'Checkout started',
      ticketNumber: checkoutLookup.ticketNumber,
      registrationNumber: checkoutLookup.registrationNumber,
    });

    return this.prisma.$transaction(
      async (tx) => {
        const activeSession = await this.parkingSessions.findActiveForCheckout(
          checkoutLookup,
          tx,
        );

        if (!activeSession) {
          throw new ApplicationError(
            ErrorCode.ACTIVE_PARKING_SESSION_NOT_FOUND,
            'Active parking session was not found',
            HttpStatus.NOT_FOUND,
          );
        }

        const exitAt = this.clock.now();
        const fee = this.fees.calculate({
          vehicleType: activeSession.vehicleType,
          entryAt: activeSession.entryAt,
          exitAt,
        });

        this.logger.log({
          message: 'Fee calculated',
          ticketNumber: activeSession.ticketNumber,
          durationMinutes: fee.durationMinutes,
          totalFeeMinorUnits: fee.totalFeeMinorUnits.toString(),
        });

        const completedSession =
          await this.parkingSessions.completeActiveSession(
            {
              id: activeSession.id,
              exitAt,
              durationMinutes: fee.durationMinutes,
              totalFeeMinorUnits: fee.totalFeeMinorUnits,
              currency: fee.currency,
              feeBreakdown: fee.breakdown as unknown as Prisma.InputJsonValue,
            },
            tx,
          );

        if (!completedSession) {
          throw new ApplicationError(
            ErrorCode.PARKING_SESSION_ALREADY_COMPLETED,
            'Parking session has already been completed',
            HttpStatus.CONFLICT,
          );
        }

        await this.parkingSessions.updateSpotStatus(
          activeSession.parkingSpotId,
          ParkingSpotStatus.AVAILABLE,
          tx,
        );

        this.logger.log({
          message: 'Checkout completed',
          ticketNumber: completedSession.ticketNumber,
          parkingSpotId: activeSession.parkingSpotId,
        });

        return this.toCheckOutResponse(activeSession, completedSession, fee);
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

  private toCheckoutLookup(dto: CheckOutParkingSessionDto): {
    ticketNumber?: string;
    registrationNumber?: string;
  } {
    const ticketNumber = dto.ticketNumber?.trim();
    const registrationNumber = dto.registrationNumber
      ? this.vehicles.normalizeRegistrationNumber(dto.registrationNumber)
      : undefined;

    if (
      (!ticketNumber && !registrationNumber) ||
      (ticketNumber && registrationNumber)
    ) {
      throw new ApplicationError(
        ErrorCode.INVALID_CHECKOUT_REQUEST,
        'Provide either ticket number or vehicle registration number',
        HttpStatus.BAD_REQUEST,
      );
    }

    return ticketNumber ? { ticketNumber } : { registrationNumber };
  }

  private toCheckOutResponse(
    activeSession: ActiveParkingSessionForCheckout,
    completedSession: ParkingSession,
    fee: {
      durationMinutes: number;
      totalFeeMinorUnits: bigint;
      currency: string;
      breakdown: FeeBreakdown;
    },
  ): CheckOutParkingSessionResponse {
    if (!completedSession.exitAt || completedSession.durationMinutes === null) {
      throw new ApplicationError(
        ErrorCode.PARKING_SESSION_CONFLICT,
        'Completed parking session is missing checkout details',
        HttpStatus.CONFLICT,
      );
    }

    return {
      ticketNumber: completedSession.ticketNumber,
      registrationNumber: activeSession.registrationNumber,
      vehicleType: activeSession.vehicleType,
      entryAt: activeSession.entryAt,
      exitAt: completedSession.exitAt,
      sessionStatus: completedSession.status,
      durationMinutes: completedSession.durationMinutes,
      totalFeeMinorUnits: fee.totalFeeMinorUnits.toString(),
      currency: fee.currency,
      feeBreakdown: fee.breakdown,
      releasedSpot: {
        id: activeSession.parkingSpotId,
        spotNumber: activeSession.parkingSpotNumber,
        type: activeSession.parkingSpotType,
        status: ParkingSpotStatus.AVAILABLE,
        floorId: activeSession.floorId,
        floorName: activeSession.floorName,
        floorNumber: activeSession.floorNumber,
        parkingLotId: activeSession.parkingLotId,
      },
    };
  }
}
