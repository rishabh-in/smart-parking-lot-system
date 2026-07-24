import { Injectable } from '@nestjs/common';
import { BillableDurationPolicy } from '../domain/billable-duration.policy';
import { BUS_RATE_CARD } from '../fee-rate-cards';
import { StartedHourPricingStrategy } from './started-hour-pricing.strategy';

@Injectable()
export class BusPricingStrategy extends StartedHourPricingStrategy {
  constructor(durationPolicy: BillableDurationPolicy) {
    super(BUS_RATE_CARD, durationPolicy);
  }
}
