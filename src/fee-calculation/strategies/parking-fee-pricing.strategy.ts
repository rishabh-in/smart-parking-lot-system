import {
  CalculateParkingFeeInput,
  ParkingFeeCalculationResult,
} from '../fee-calculation.types';

export interface ParkingFeePricingStrategy {
  calculate(input: CalculateParkingFeeInput): ParkingFeeCalculationResult;
}
