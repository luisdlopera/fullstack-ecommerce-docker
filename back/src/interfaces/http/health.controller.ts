import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return { ok: true, service: 'nexstore-back' };
  }
}
