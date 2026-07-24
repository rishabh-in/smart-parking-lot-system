import { HttpStatus, Injectable } from '@nestjs/common';
import { ParkingSpotStatus } from '@prisma/client';
import { ApplicationError } from '../../common/errors/application-error';
import { ErrorCode } from '../../common/errors/error-code';

const ALLOWED_TRANSITIONS: ReadonlyMap<
  ParkingSpotStatus,
  ReadonlySet<ParkingSpotStatus>
> = new Map<ParkingSpotStatus, ReadonlySet<ParkingSpotStatus>>([
  [
    ParkingSpotStatus.AVAILABLE,
    new Set<ParkingSpotStatus>([
      ParkingSpotStatus.RESERVED,
      ParkingSpotStatus.OUT_OF_SERVICE,
    ]),
  ],
  [
    ParkingSpotStatus.RESERVED,
    new Set<ParkingSpotStatus>([
      ParkingSpotStatus.OCCUPIED,
      ParkingSpotStatus.AVAILABLE,
    ]),
  ],
  [
    ParkingSpotStatus.OCCUPIED,
    new Set<ParkingSpotStatus>([ParkingSpotStatus.AVAILABLE]),
  ],
  [
    ParkingSpotStatus.OUT_OF_SERVICE,
    new Set<ParkingSpotStatus>([ParkingSpotStatus.AVAILABLE]),
  ],
]);

@Injectable()
export class ParkingSpotStatusTransitionPolicy {
  assertCanTransition(
    currentStatus: ParkingSpotStatus,
    nextStatus: ParkingSpotStatus,
  ): void {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS.get(currentStatus);

    if (!allowedNextStatuses?.has(nextStatus)) {
      throw new ApplicationError(
        ErrorCode.INVALID_SPOT_STATUS_TRANSITION,
        `Parking spot cannot transition from ${currentStatus} to ${nextStatus}`,
        HttpStatus.CONFLICT,
      );
    }
  }
}
