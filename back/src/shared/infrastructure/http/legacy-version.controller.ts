import { Controller, All, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller('v1')
export class LegacyVersionController {
  @All('*')
  redirect(@Req() req: Request, @Res() res: Response) {
    const originalUrl = req.originalUrl ?? '';
    const target = originalUrl.replace('/api/v1', '/api');
    return res.redirect(308, target || '/api');
  }
}
