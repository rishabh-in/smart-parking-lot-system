import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function resetDatabase(): Promise<void> {
  await prisma.parkingSession.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.parkingSpot.deleteMany();
  await prisma.parkingFloor.deleteMany();
  await prisma.parkingLot.deleteMany();
}
