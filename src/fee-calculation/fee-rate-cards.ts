import { VehicleType } from '@prisma/client';
import { StartedHourRateCard } from './fee-calculation.types';

export const INR = 'INR';

export const MOTORCYCLE_RATE_CARD: StartedHourRateCard = {
  vehicleType: VehicleType.MOTORCYCLE,
  currency: INR,
  firstHourRateMinorUnits: 2_000n,
  additionalHourRateMinorUnits: 1_000n,
};

export const CAR_RATE_CARD: StartedHourRateCard = {
  vehicleType: VehicleType.CAR,
  currency: INR,
  firstHourRateMinorUnits: 4_000n,
  additionalHourRateMinorUnits: 2_000n,
};

export const BUS_RATE_CARD: StartedHourRateCard = {
  vehicleType: VehicleType.BUS,
  currency: INR,
  firstHourRateMinorUnits: 10_000n,
  additionalHourRateMinorUnits: 5_000n,
};
