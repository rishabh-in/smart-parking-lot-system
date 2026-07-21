-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTORCYCLE', 'CAR', 'BUS');

-- CreateEnum
CREATE TYPE "ParkingSpotType" AS ENUM ('MOTORCYCLE', 'COMPACT', 'LARGE');

-- CreateEnum
CREATE TYPE "ParkingSpotStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "ParkingSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "parking_lots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_floors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parking_lot_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "floor_number" INTEGER NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "floor_id" UUID NOT NULL,
    "spot_number" TEXT NOT NULL,
    "type" "ParkingSpotType" NOT NULL,
    "status" "ParkingSpotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_spots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "registration_number" TEXT NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_number" TEXT NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "parking_spot_id" UUID NOT NULL,
    "entry_at" TIMESTAMP(3) NOT NULL,
    "exit_at" TIMESTAMP(3),
    "status" "ParkingSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "duration_minutes" INTEGER,
    "total_fee_minor_units" BIGINT,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "fee_breakdown" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parking_lots_is_active_idx" ON "parking_lots"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "parking_floors_lot_floor_number_key" ON "parking_floors"("parking_lot_id", "floor_number");

-- CreateIndex
CREATE UNIQUE INDEX "parking_floors_lot_name_key" ON "parking_floors"("parking_lot_id", "name");

-- CreateIndex
CREATE INDEX "parking_floors_lot_active_sort_idx" ON "parking_floors"("parking_lot_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_floor_spot_number_key" ON "parking_spots"("floor_id", "spot_number");

-- CreateIndex
CREATE INDEX "parking_spots_floor_availability_idx" ON "parking_spots"("floor_id", "status", "type", "is_active", "priority", "spot_number");

-- CreateIndex
CREATE INDEX "parking_spots_allocation_lookup_idx" ON "parking_spots"("status", "type", "is_active", "priority", "spot_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registration_number_key" ON "vehicles"("registration_number");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_type_idx" ON "vehicles"("vehicle_type");

-- CreateIndex
CREATE UNIQUE INDEX "parking_sessions_ticket_number_key" ON "parking_sessions"("ticket_number");

-- CreateIndex
CREATE INDEX "parking_sessions_vehicle_status_idx" ON "parking_sessions"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "parking_sessions_spot_status_idx" ON "parking_sessions"("parking_spot_id", "status");

-- CreateIndex
CREATE INDEX "parking_sessions_status_entry_idx" ON "parking_sessions"("status", "entry_at");

-- PostgreSQL partial unique indexes cannot be represented directly in Prisma schema.
-- They enforce one active session per vehicle and one active session per parking spot at the database layer.
CREATE UNIQUE INDEX "parking_sessions_one_active_per_vehicle_idx"
    ON "parking_sessions"("vehicle_id")
    WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "parking_sessions_one_active_per_spot_idx"
    ON "parking_sessions"("parking_spot_id")
    WHERE "status" = 'ACTIVE';

-- AddForeignKey
ALTER TABLE "parking_floors" ADD CONSTRAINT "parking_floors_parking_lot_id_fkey" FOREIGN KEY ("parking_lot_id") REFERENCES "parking_lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "parking_floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_sessions" ADD CONSTRAINT "parking_sessions_parking_spot_id_fkey" FOREIGN KEY ("parking_spot_id") REFERENCES "parking_spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
