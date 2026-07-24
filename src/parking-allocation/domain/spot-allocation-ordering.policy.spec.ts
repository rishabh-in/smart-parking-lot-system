import { ParkingSpotType, VehicleType } from '@prisma/client';
import {
  AllocationCandidate,
  SpotAllocationOrderingPolicy,
} from './spot-allocation-ordering.policy';
import { SpotCompatibilityPolicy } from './spot-compatibility.policy';

describe('SpotAllocationOrderingPolicy', () => {
  const policy = new SpotAllocationOrderingPolicy(
    new SpotCompatibilityPolicy(),
  );

  it('orders by smallest compatible spot, floor order, priority, spot number, then id', () => {
    const candidates: AllocationCandidate[] = [
      candidate('large-near', ParkingSpotType.LARGE, 1, 1, 'F1-L-01'),
      candidate('compact-far', ParkingSpotType.COMPACT, 2, 1, 'F2-C-01'),
      candidate('compact-later', ParkingSpotType.COMPACT, 1, 2, 'F1-C-02'),
      candidate('compact-first', ParkingSpotType.COMPACT, 1, 1, 'F1-C-01'),
    ];

    expect(policy.orderCandidates(VehicleType.CAR, candidates)).toEqual([
      candidate('compact-first', ParkingSpotType.COMPACT, 1, 1, 'F1-C-01'),
      candidate('compact-later', ParkingSpotType.COMPACT, 1, 2, 'F1-C-02'),
      candidate('compact-far', ParkingSpotType.COMPACT, 2, 1, 'F2-C-01'),
      candidate('large-near', ParkingSpotType.LARGE, 1, 1, 'F1-L-01'),
    ]);
  });

  it('filters incompatible spots before ordering', () => {
    const candidates: AllocationCandidate[] = [
      candidate('compact', ParkingSpotType.COMPACT, 1, 1, 'F1-C-01'),
      candidate('large', ParkingSpotType.LARGE, 1, 2, 'F1-L-01'),
    ];

    expect(policy.orderCandidates(VehicleType.BUS, candidates)).toEqual([
      candidate('large', ParkingSpotType.LARGE, 1, 2, 'F1-L-01'),
    ]);
  });
});

function candidate(
  id: string,
  type: ParkingSpotType,
  floorSortOrder: number,
  priority: number,
  spotNumber: string,
): AllocationCandidate {
  return { id, type, floorSortOrder, priority, spotNumber };
}
