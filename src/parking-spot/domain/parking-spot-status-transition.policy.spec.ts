import { ParkingSpotStatus } from '@prisma/client';
import { ErrorCode } from '../../common/errors/error-code';
import { ParkingSpotStatusTransitionPolicy } from './parking-spot-status-transition.policy';

describe('ParkingSpotStatusTransitionPolicy', () => {
  const policy = new ParkingSpotStatusTransitionPolicy();

  it.each([
    [ParkingSpotStatus.AVAILABLE, ParkingSpotStatus.RESERVED],
    [ParkingSpotStatus.AVAILABLE, ParkingSpotStatus.OUT_OF_SERVICE],
    [ParkingSpotStatus.RESERVED, ParkingSpotStatus.OCCUPIED],
    [ParkingSpotStatus.RESERVED, ParkingSpotStatus.AVAILABLE],
    [ParkingSpotStatus.OCCUPIED, ParkingSpotStatus.AVAILABLE],
    [ParkingSpotStatus.OUT_OF_SERVICE, ParkingSpotStatus.AVAILABLE],
  ])('allows %s to %s', (currentStatus, nextStatus) => {
    expect(() =>
      policy.assertCanTransition(currentStatus, nextStatus),
    ).not.toThrow();
  });

  it('allows idempotent transitions', () => {
    expect(() =>
      policy.assertCanTransition(
        ParkingSpotStatus.AVAILABLE,
        ParkingSpotStatus.AVAILABLE,
      ),
    ).not.toThrow();
  });

  it('rejects invalid transitions', () => {
    let error: unknown;

    try {
      policy.assertCanTransition(
        ParkingSpotStatus.OUT_OF_SERVICE,
        ParkingSpotStatus.OCCUPIED,
      );
    } catch (caughtError: unknown) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      code: ErrorCode.INVALID_SPOT_STATUS_TRANSITION,
    });
  });
});
