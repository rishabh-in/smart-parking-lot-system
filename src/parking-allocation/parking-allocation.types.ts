import {
  ParkingSpotStatus,
  ParkingSpotType,
  VehicleType,
} from '@prisma/client';

export interface AllocateParkingSpotInput {
  vehicleType: VehicleType;
  parkingLotId?: string;
}

export interface AllocatedParkingSpot {
  id: string;
  floorId: string;
  parkingLotId: string;
  spotNumber: string;
  type: ParkingSpotType;
  status: ParkingSpotStatus;
  priority: number;
  floorName: string;
  floorNumber: number;
  floorSortOrder: number;
}
