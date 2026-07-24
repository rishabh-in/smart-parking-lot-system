import { Test, TestingModule } from '@nestjs/testing';
import { VehicleType } from '@prisma/client';
import { ErrorCode } from '../common/errors/error-code';
import { FeeCalculationModule } from './fee-calculation.module';
import { FeeCalculationService } from './fee-calculation.service';

describe('FeeCalculationService', () => {
  let service: FeeCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [FeeCalculationModule],
    }).compile();

    service = module.get(FeeCalculationService);
  });

  it.each([
    [VehicleType.MOTORCYCLE, 2_000n],
    [VehicleType.CAR, 4_000n],
    [VehicleType.BUS, 10_000n],
  ])('charges first-hour rate for %s', (vehicleType, expectedFee) => {
    const result = service.calculate({
      vehicleType,
      entryAt: dateAtMinutes(0),
      exitAt: dateAtMinutes(60),
    });

    expect(result.billableHours).toBe(1);
    expect(result.durationMinutes).toBe(60);
    expect(result.totalFeeMinorUnits).toBe(expectedFee);
    expect(result.breakdown.totalFeeMinorUnits).toBe(expectedFee.toString());
  });

  it('applies one-hour minimum billing for zero-minute sessions', () => {
    const result = service.calculate({
      vehicleType: VehicleType.MOTORCYCLE,
      entryAt: dateAtMinutes(10),
      exitAt: dateAtMinutes(10),
    });

    expect(result.durationMinutes).toBe(0);
    expect(result.billableHours).toBe(1);
    expect(result.totalFeeMinorUnits).toBe(2_000n);
  });

  it('rounds partial hours up to the next billable hour', () => {
    const result = service.calculate({
      vehicleType: VehicleType.CAR,
      entryAt: dateAtMinutes(0),
      exitAt: dateAtMinutes(61),
    });

    expect(result.durationMinutes).toBe(61);
    expect(result.billableHours).toBe(2);
    expect(result.totalFeeMinorUnits).toBe(6_000n);
    expect(result.breakdown.lineItems).toEqual([
      {
        label: 'First hour',
        quantity: 1,
        rateMinorUnits: '4000',
        amountMinorUnits: '4000',
      },
      {
        label: 'Additional started hours',
        quantity: 1,
        rateMinorUnits: '2000',
        amountMinorUnits: '2000',
      },
    ]);
  });

  it('charges exact multiple hours without extra rounding', () => {
    const result = service.calculate({
      vehicleType: VehicleType.BUS,
      entryAt: dateAtMinutes(0),
      exitAt: dateAtMinutes(180),
    });

    expect(result.durationMinutes).toBe(180);
    expect(result.billableHours).toBe(3);
    expect(result.totalFeeMinorUnits).toBe(20_000n);
  });

  it('rejects negative durations', () => {
    let error: unknown;

    try {
      service.calculate({
        vehicleType: VehicleType.CAR,
        entryAt: dateAtMinutes(120),
        exitAt: dateAtMinutes(60),
      });
    } catch (caughtError: unknown) {
      error = caughtError;
    }

    expect(error).toMatchObject({
      code: ErrorCode.INVALID_PARKING_SESSION_DURATION,
    });
  });
});

function dateAtMinutes(minutes: number): Date {
  return new Date(Date.UTC(2026, 6, 24, 10, minutes, 0, 0));
}
