import { Injectable } from '@nestjs/common';
import { BillableDurationPolicy } from '../domain/billable-duration.policy';
import { MOTORCYCLE_RATE_CARD } from '../fee-rate-cards';
import { StartedHourPricingStrategy } from './started-hour-pricing.strategy';

@Injectable()
export class MotorcyclePricingStrategy extends StartedHourPricingStrategy {
  constructor(durationPolicy: BillableDurationPolicy) {
    super(MOTORCYCLE_RATE_CARD, durationPolicy);
  }
}
