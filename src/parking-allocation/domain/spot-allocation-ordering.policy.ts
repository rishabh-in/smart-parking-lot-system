import { Injectable } from '@nestjs/common';
import { ParkingSpotType, VehicleType } from '@prisma/client';
import { SpotCompatibilityPolicy } from './spot-compatibility.policy';

export interface AllocationCandidate {
  id: string;
  type: ParkingSpotType;
  floorSortOrder: number;
  priority: number;
  spotNumber: string;
}

@Injectable()
export class SpotAllocationOrderingPolicy {
  constructor(private readonly compatibility: SpotCompatibilityPolicy) {}

  orderCandidates(
    vehicleType: VehicleType,
    candidates: AllocationCandidate[],
  ): AllocationCandidate[] {
    return candidates
      .filter((candidate) =>
        this.compatibility.isCompatible(vehicleType, candidate.type),
      )
      .toSorted((left, right) =>
        this.compareCandidates(vehicleType, left, right),
      );
  }

  private compareCandidates(
    vehicleType: VehicleType,
    left: AllocationCandidate,
    right: AllocationCandidate,
  ): number {
    return (
      this.compatibility.getPreferenceRank(vehicleType, left.type) -
        this.compatibility.getPreferenceRank(vehicleType, right.type) ||
      left.floorSortOrder - right.floorSortOrder ||
      left.priority - right.priority ||
      left.spotNumber.localeCompare(right.spotNumber) ||
      left.id.localeCompare(right.id)
    );
  }
}
