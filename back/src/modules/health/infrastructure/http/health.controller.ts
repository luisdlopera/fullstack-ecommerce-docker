import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
      () => ({
        uptime: {
          status: 'up',
          seconds: Math.floor(process.uptime()),
        },
      }),
    ]);
  }

  @Get('simple')
  async getHealth() {
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      /* db unreachable */
    }

    return {
      ok: dbOk,
      service: 'nexstore-back',
      uptime: Math.floor(process.uptime()),
      database: dbOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
