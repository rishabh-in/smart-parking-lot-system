import { HttpStatus, Injectable } from '@nestjs/common';
import { VehicleType } from '@prisma/client';
import { ApplicationError } from '../common/errors/application-error';
import { ErrorCode } from '../common/errors/error-code';
import { BusPricingStrategy } from './strategies/bus-pricing.strategy';
import { CarPricingStrategy } from './strategies/car-pricing.strategy';
import { MotorcyclePricingStrategy } from './strategies/motorcycle-pricing.strategy';
import { ParkingFeePricingStrategy } from './strategies/parking-fee-pricing.strategy';

@Injectable()
export class ParkingFeeStrategyResolver {
  private readonly strategies: ReadonlyMap<
    VehicleType,
    ParkingFeePricingStrategy
  >;

  constructor(
    motorcyclePricing: MotorcyclePricingStrategy,
    carPricing: CarPricingStrategy,
    busPricing: BusPricingStrategy,
  ) {
    this.strategies = new Map([
      [VehicleType.MOTORCYCLE, motorcyclePricing],
      [VehicleType.CAR, carPricing],
      [VehicleType.BUS, busPricing],
    ]);
  }

  resolve(vehicleType: VehicleType): ParkingFeePricingStrategy {
    const strategy = this.strategies.get(vehicleType);

    if (!strategy) {
      throw new ApplicationError(
        ErrorCode.INVALID_VEHICLE_TYPE,
        'Vehicle type is not supported for fee calculation',
        HttpStatus.BAD_REQUEST,
      );
    }

    return strategy;
  }
}
