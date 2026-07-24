import { Injectable } from '@nestjs/common';
import {
  CalculateParkingFeeInput,
  ParkingFeeCalculationResult,
} from './fee-calculation.types';
import { ParkingFeeStrategyResolver } from './parking-fee-strategy-resolver';

@Injectable()
export class FeeCalculationService {
  constructor(private readonly strategies: ParkingFeeStrategyResolver) {}

  calculate(input: CalculateParkingFeeInput): ParkingFeeCalculationResult {
    return this.strategies.resolve(input.vehicleType).calculate(input);
  }
}
