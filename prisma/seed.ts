import {
  ParkingSpotStatus,
  ParkingSpotType,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();

interface FloorSeed {
  id: string;
  name: string;
  floorNumber: number;
  description: string;
  sortOrder: number;
}

interface SpotSeed {
  floorId: string;
  spotNumber: string;
  type: ParkingSpotType;
  priority: number;
}

const PARKING_LOT_ID = '11111111-1111-4111-8111-111111111111';

const FLOORS: FloorSeed[] = [
  {
    id: '22222222-2222-4222-8222-222222222221',
    name: 'Ground Floor',
    floorNumber: 1,
    description: 'Entry-level floor with quickest access to exits.',
    sortOrder: 1,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Level 2',
    floorNumber: 2,
    description: 'General parking floor for regular traffic.',
    sortOrder: 2,
  },
  {
    id: '22222222-2222-4222-8222-222222222223',
    name: 'Level 3',
    floorNumber: 3,
    description: 'Upper floor for overflow and large vehicle capacity.',
    sortOrder: 3,
  },
];

async function main(): Promise<void> {
  await prisma.parkingLot.upsert({
    where: { id: PARKING_LOT_ID },
    update: {
      name: 'Central Smart Parking',
      address: 'Main Campus Entrance',
      description: 'Default seeded multi-floor smart parking lot.',
      timezone: 'Asia/Kolkata',
      isActive: true,
    },
    create: {
      id: PARKING_LOT_ID,
      name: 'Central Smart Parking',
      address: 'Main Campus Entrance',
      description: 'Default seeded multi-floor smart parking lot.',
      timezone: 'Asia/Kolkata',
      isActive: true,
    },
  });

  for (const floor of FLOORS) {
    await prisma.parkingFloor.upsert({
      where: { id: floor.id },
      update: {
        name: floor.name,
        floorNumber: floor.floorNumber,
        description: floor.description,
        sortOrder: floor.sortOrder,
        isActive: true,
      },
      create: {
        id: floor.id,
        parkingLotId: PARKING_LOT_ID,
        name: floor.name,
        floorNumber: floor.floorNumber,
        description: floor.description,
        sortOrder: floor.sortOrder,
        isActive: true,
      },
    });
  }

  for (const spot of buildSpotSeeds()) {
    await prisma.parkingSpot.upsert({
      where: {
        floorId_spotNumber: {
          floorId: spot.floorId,
          spotNumber: spot.spotNumber,
        },
      },
      update: {
        type: spot.type,
        priority: spot.priority,
        isActive: true,
      },
      create: {
        floorId: spot.floorId,
        spotNumber: spot.spotNumber,
        type: spot.type,
        status: ParkingSpotStatus.AVAILABLE,
        priority: spot.priority,
        isActive: true,
      },
    });
  }
}

function buildSpotSeeds(): SpotSeed[] {
  return FLOORS.flatMap((floor) => [
    ...buildTypedSpots(floor, ParkingSpotType.MOTORCYCLE, 'M', 8, 0),
    ...buildTypedSpots(floor, ParkingSpotType.COMPACT, 'C', 12, 100),
    ...buildTypedSpots(floor, ParkingSpotType.LARGE, 'L', 4, 200),
  ]);
}

function buildTypedSpots(
  floor: FloorSeed,
  type: ParkingSpotType,
  label: string,
  count: number,
  typePriorityOffset: number,
): SpotSeed[] {
  return Array.from({ length: count }, (_, index) => {
    const sequence = index + 1;

    return {
      floorId: floor.id,
      spotNumber: `F${floor.floorNumber}-${label}-${sequence.toString().padStart(2, '0')}`,
      type,
      priority: floor.sortOrder * 1000 + typePriorityOffset + sequence,
    };
  });
}

main()
  .catch((error: unknown) => {
    console.error('Failed to seed parking lot data', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
