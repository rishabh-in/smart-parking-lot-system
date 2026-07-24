import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '../../common/errors/application-error';
import { ErrorCode } from '../../common/errors/error-code';

const MILLISECONDS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

@Injectable()
export class BillableDurationPolicy {
  calculateDurationMinutes(entryAt: Date, exitAt: Date): number {
    const durationMilliseconds = exitAt.getTime() - entryAt.getTime();

    if (durationMilliseconds < 0) {
      throw new ApplicationError(
        ErrorCode.INVALID_PARKING_SESSION_DURATION,
        'Parking session exit time cannot be before entry time',
        HttpStatus.BAD_REQUEST,
      );
    }

    return Math.ceil(durationMilliseconds / MILLISECONDS_PER_MINUTE);
  }

  calculateBillableHours(durationMinutes: number): number {
    return Math.max(1, Math.ceil(durationMinutes / MINUTES_PER_HOUR));
  }
}
