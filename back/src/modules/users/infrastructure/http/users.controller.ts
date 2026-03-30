import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
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

  @Get('addresses')
  listMyAddresses(
    @CurrentUser() user: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.usersService.listMyAddresses(user.sub, page, limit);
  }

  @Post('addresses')
  createMyAddress(@CurrentUser() user: JwtPayload, @Body() dto: UpsertAddressDto) {
    return this.usersService.createMyAddress(user.sub, dto);
  }

  @Put('addresses/:addressId')
  updateMyAddress(
    @CurrentUser() user: JwtPayload,
    @Param('addressId') addressId: string,
    @Body() dto: UpsertAddressDto,
  ) {
    return this.usersService.updateMyAddress(user.sub, addressId, dto);
  }

  @Delete('addresses/:addressId')
  deleteMyAddressById(@CurrentUser() user: JwtPayload, @Param('addressId') addressId: string) {
    return this.usersService.deleteMyAddressById(user.sub, addressId);
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
  listMyFavorites(
    @CurrentUser() user: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    if (page !== undefined || limit !== undefined) {
      return this.usersService.listMyFavoritesPaginated(user.sub, page, limit);
    }
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
