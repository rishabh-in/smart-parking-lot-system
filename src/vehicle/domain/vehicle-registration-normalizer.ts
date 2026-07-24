import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '../../common/errors/application-error';
import { ErrorCode } from '../../common/errors/error-code';

const NORMALIZED_REGISTRATION_PATTERN = /^[A-Z0-9]{4,20}$/;

@Injectable()
export class VehicleRegistrationNormalizer {
  normalize(registrationNumber: string): string {
    const normalized = registrationNumber
      .trim()
      .toUpperCase()
      .replace(/[\s-]/g, '');

    if (!NORMALIZED_REGISTRATION_PATTERN.test(normalized)) {
      throw new ApplicationError(
        ErrorCode.INVALID_VEHICLE_REGISTRATION_NUMBER,
        'Vehicle registration number is invalid',
        HttpStatus.BAD_REQUEST,
      );
    }

    return normalized;
  }
}
