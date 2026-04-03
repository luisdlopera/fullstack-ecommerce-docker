import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../../../../shared/infrastructure/auth/public.decorator';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Get()
  async check() {
    const checks: Record<string, { status: string; details?: unknown }> = {};
    let status = 'ok';

    // Database check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'up' };
    } catch (error) {
      checks.database = { status: 'down', details: error instanceof Error ? error.message : 'Unknown error' };
      status = 'error';
    }

    // Memory check
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const rssMB = Math.round(used.rss / 1024 / 1024);
    
    checks.memory = {
      status: heapUsedMB < 150 ? 'up' : 'warning',
      details: { heapUsed: `${heapUsedMB}MB`, rss: `${rssMB}MB` },
    };

    if (heapUsedMB > 300) {
      status = 'error';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      checks,
    };
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
