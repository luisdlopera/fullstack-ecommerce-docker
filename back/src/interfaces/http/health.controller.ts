import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../../common/auth/public.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Public()
@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
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
      timestamp: new Date().toISOString()
    };
  }
}
