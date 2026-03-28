import { Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { UpsertAddressDto } from './dto/upsert-address.dto';
import { UsersService } from '../../application/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddFavoriteDto } from './dto/add-favorite.dto';

@Controller('users/me')
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get('profile')
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMyProfile(user.sub);
  }

  @Put('profile')
  updateMyProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMyProfile(user.sub, dto);
  }

  @Put('password')
  changeMyPassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.usersService.changeMyPassword(user.sub, dto);
  }

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

  @Get('favorites')
  listMyFavorites(@CurrentUser() user: JwtPayload) {
    return this.usersService.listMyFavorites(user.sub);
  }

  @Post('favorites')
  addMyFavorite(@CurrentUser() user: JwtPayload, @Body() dto: AddFavoriteDto) {
    return this.usersService.addMyFavorite(user.sub, dto.productId);
  }

  @Delete('favorites/:productId')
  removeMyFavorite(@CurrentUser() user: JwtPayload, @Param('productId') productId: string) {
    return this.usersService.removeMyFavorite(user.sub, productId);
  }
}
