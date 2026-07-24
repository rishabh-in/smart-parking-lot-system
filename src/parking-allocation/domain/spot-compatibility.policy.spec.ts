import { ParkingSpotType, VehicleType } from '@prisma/client';
import { SpotCompatibilityPolicy } from './spot-compatibility.policy';

describe('SpotCompatibilityPolicy', () => {
  const policy = new SpotCompatibilityPolicy();

  it('prefers motorcycle, then compact, then large spots for motorcycles', () => {
    expect(policy.getCompatibleSpotTypes(VehicleType.MOTORCYCLE)).toEqual([
      ParkingSpotType.MOTORCYCLE,
      ParkingSpotType.COMPACT,
      ParkingSpotType.LARGE,
    ]);
  });

  it('prefers compact, then large spots for cars', () => {
    expect(policy.getCompatibleSpotTypes(VehicleType.CAR)).toEqual([
      ParkingSpotType.COMPACT,
      ParkingSpotType.LARGE,
    ]);
  });

  it('allows only large spots for buses', () => {
    expect(policy.getCompatibleSpotTypes(VehicleType.BUS)).toEqual([
      ParkingSpotType.LARGE,
    ]);
  });

  it('reports incompatible spot types', () => {
    expect(policy.isCompatible(VehicleType.BUS, ParkingSpotType.COMPACT)).toBe(
      false,
    );
  });
});
