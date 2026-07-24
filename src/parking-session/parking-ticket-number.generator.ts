import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

@Injectable()
export class ParkingTicketNumberGenerator {
  generate(entryAt: Date): string {
    const datePart = entryAt.toISOString().slice(0, 10).replace(/-/g, '');
    const entropy = randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();

    return `PK-${datePart}-${entropy}`;
  }
}
