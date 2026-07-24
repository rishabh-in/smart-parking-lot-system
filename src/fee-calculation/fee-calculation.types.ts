import { VehicleType } from '@prisma/client';

export interface CalculateParkingFeeInput {
  vehicleType: VehicleType;
  entryAt: Date;
  exitAt: Date;
}

export interface FeeLineItem {
  label: string;
  quantity: number;
  rateMinorUnits: string;
  amountMinorUnits: string;
}

export interface FeeBreakdown {
  vehicleType: VehicleType;
  currency: string;
  durationMinutes: number;
  billableHours: number;
  lineItems: FeeLineItem[];
  totalFeeMinorUnits: string;
}

export interface ParkingFeeCalculationResult {
  vehicleType: VehicleType;
  currency: string;
  durationMinutes: number;
  billableHours: number;
  totalFeeMinorUnits: bigint;
  breakdown: FeeBreakdown;
}

export interface StartedHourRateCard {
  vehicleType: VehicleType;
  currency: string;
  firstHourRateMinorUnits: bigint;
  additionalHourRateMinorUnits: bigint;
}
