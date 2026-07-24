import { BillableDurationPolicy } from '../domain/billable-duration.policy';
import {
  CalculateParkingFeeInput,
  FeeLineItem,
  ParkingFeeCalculationResult,
  StartedHourRateCard,
} from '../fee-calculation.types';
import { ParkingFeePricingStrategy } from './parking-fee-pricing.strategy';

export abstract class StartedHourPricingStrategy implements ParkingFeePricingStrategy {
  protected constructor(
    private readonly rateCard: StartedHourRateCard,
    private readonly durationPolicy: BillableDurationPolicy,
  ) {}

  calculate(input: CalculateParkingFeeInput): ParkingFeeCalculationResult {
    const durationMinutes = this.durationPolicy.calculateDurationMinutes(
      input.entryAt,
      input.exitAt,
    );
    const billableHours =
      this.durationPolicy.calculateBillableHours(durationMinutes);
    const additionalHours = Math.max(0, billableHours - 1);
    const firstHourAmount = this.rateCard.firstHourRateMinorUnits;
    const additionalHoursAmount =
      BigInt(additionalHours) * this.rateCard.additionalHourRateMinorUnits;
    const totalFeeMinorUnits = firstHourAmount + additionalHoursAmount;
    const lineItems = this.buildLineItems(
      additionalHours,
      additionalHoursAmount,
    );

    return {
      vehicleType: this.rateCard.vehicleType,
      currency: this.rateCard.currency,
      durationMinutes,
      billableHours,
      totalFeeMinorUnits,
      breakdown: {
        vehicleType: this.rateCard.vehicleType,
        currency: this.rateCard.currency,
        durationMinutes,
        billableHours,
        lineItems,
        totalFeeMinorUnits: totalFeeMinorUnits.toString(),
      },
    };
  }

  private buildLineItems(
    additionalHours: number,
    additionalHoursAmount: bigint,
  ): FeeLineItem[] {
    const lineItems: FeeLineItem[] = [
      {
        label: 'First hour',
        quantity: 1,
        rateMinorUnits: this.rateCard.firstHourRateMinorUnits.toString(),
        amountMinorUnits: this.rateCard.firstHourRateMinorUnits.toString(),
      },
    ];

    if (additionalHours > 0) {
      lineItems.push({
        label: 'Additional started hours',
        quantity: additionalHours,
        rateMinorUnits: this.rateCard.additionalHourRateMinorUnits.toString(),
        amountMinorUnits: additionalHoursAmount.toString(),
      });
    }

    return lineItems;
  }
}
