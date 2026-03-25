import { Body, Controller, Delete, Get, Put } from '@nestjs/common';
import { CurrentUser } from '../common/auth/current-user.decorator';
import type { JwtPayload } from '../common/auth/jwt-payload';
import { UpsertAddressDto } from './dto/upsert-address.dto';
import { UsersService } from './users.service';

@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('address')
  getMyAddress(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMyAddress(user.sub);
  }

  @Put('address')
  upsertMyAddress(@CurrentUser() user: JwtPayload, @Body() dto: UpsertAddressDto) {
    return this.usersService.upsertMyAddress(user.sub, dto);
  }

  @Delete('address')
  deleteMyAddress(@CurrentUser() user: JwtPayload) {
    return this.usersService.deleteMyAddress(user.sub);
  }
}
