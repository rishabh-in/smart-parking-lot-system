import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application and database health' })
  @ApiOkResponse({ description: 'Application and database are healthy.' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () =>
        Promise.resolve({
          application: {
            status: 'up',
          },
        }),
      () => this.database.pingCheck('database', this.prisma),
    ]);
  }
}
