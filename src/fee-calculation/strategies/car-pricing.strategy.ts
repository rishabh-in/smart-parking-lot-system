import { Injectable } from '@nestjs/common';
import { BillableDurationPolicy } from '../domain/billable-duration.policy';
import { CAR_RATE_CARD } from '../fee-rate-cards';
import { StartedHourPricingStrategy } from './started-hour-pricing.strategy';

@Injectable()
export class CarPricingStrategy extends StartedHourPricingStrategy {
  constructor(durationPolicy: BillableDurationPolicy) {
    super(CAR_RATE_CARD, durationPolicy);
  }
}
