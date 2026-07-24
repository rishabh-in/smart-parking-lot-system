import { ErrorCode } from '../../common/errors/error-code';
import { VehicleRegistrationNormalizer } from './vehicle-registration-normalizer';

describe('VehicleRegistrationNormalizer', () => {
  const normalizer = new VehicleRegistrationNormalizer();

  it('trims, uppercases, and removes spaces and hyphens', () => {
    expect(normalizer.normalize(' ka-01 ab 1234 ')).toBe('KA01AB1234');
  });

  it('rejects invalid registration numbers', () => {
    let error: unknown;

    try {
      normalizer.normalize('ka@123');
    } catch (caughtError: unknown) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      code: ErrorCode.INVALID_VEHICLE_REGISTRATION_NUMBER,
    });
  });
});
