import { Injectable } from '@nestjs/common';
import { ParkingSpotType, VehicleType } from '@prisma/client';

const COMPATIBLE_SPOT_TYPES: Readonly<Record<VehicleType, ParkingSpotType[]>> =
  {
    [VehicleType.MOTORCYCLE]: [
      ParkingSpotType.MOTORCYCLE,
      ParkingSpotType.COMPACT,
      ParkingSpotType.LARGE,
    ],
    [VehicleType.CAR]: [ParkingSpotType.COMPACT, ParkingSpotType.LARGE],
    [VehicleType.BUS]: [ParkingSpotType.LARGE],
  };

@Injectable()
export class SpotCompatibilityPolicy {
  getCompatibleSpotTypes(vehicleType: VehicleType): ParkingSpotType[] {
    return [...COMPATIBLE_SPOT_TYPES[vehicleType]];
  }

  isCompatible(vehicleType: VehicleType, spotType: ParkingSpotType): boolean {
    return COMPATIBLE_SPOT_TYPES[vehicleType].includes(spotType);
  }

  getPreferenceRank(
    vehicleType: VehicleType,
    spotType: ParkingSpotType,
  ): number {
    const index = COMPATIBLE_SPOT_TYPES[vehicleType].indexOf(spotType);

    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }
}
