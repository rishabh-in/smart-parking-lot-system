import { Module } from '@nestjs/common';
import { BillableDurationPolicy } from './domain/billable-duration.policy';
import { FeeCalculationService } from './fee-calculation.service';
import { ParkingFeeStrategyResolver } from './parking-fee-strategy-resolver';
import { BusPricingStrategy } from './strategies/bus-pricing.strategy';
import { CarPricingStrategy } from './strategies/car-pricing.strategy';
import { MotorcyclePricingStrategy } from './strategies/motorcycle-pricing.strategy';

@Module({
  providers: [
    FeeCalculationService,
    BillableDurationPolicy,
    MotorcyclePricingStrategy,
    CarPricingStrategy,
    BusPricingStrategy,
    ParkingFeeStrategyResolver,
  ],
  exports: [FeeCalculationService],
})
export class FeeCalculationModule {}
