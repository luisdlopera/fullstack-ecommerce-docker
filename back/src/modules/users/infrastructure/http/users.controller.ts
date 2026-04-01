import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../../../shared/infrastructure/auth/current-user.decorator';
import type { JwtPayload } from '../../../../shared/infrastructure/auth/jwt-payload';
import { UpsertAddressDto } from './dto/upsert-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { GetMyProfileUseCase } from '../../application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../../application/use-cases/update-my-profile.use-case';
import { ChangeMyPasswordUseCase } from '../../application/use-cases/change-my-password.use-case';
import { GetMyAddressUseCase } from '../../application/use-cases/get-my-address.use-case';
import { ListMyAddressesUseCase } from '../../application/use-cases/list-my-addresses.use-case';
import { CreateMyAddressUseCase } from '../../application/use-cases/create-my-address.use-case';
import { UpdateMyAddressUseCase } from '../../application/use-cases/update-my-address.use-case';
import { DeleteMyAddressByIdUseCase } from '../../application/use-cases/delete-my-address-by-id.use-case';
import { UpsertMyAddressUseCase } from '../../application/use-cases/upsert-my-address.use-case';
import { DeleteMyAddressUseCase } from '../../application/use-cases/delete-my-address.use-case';
import { ListMyFavoritesUseCase } from '../../application/use-cases/list-my-favorites.use-case';
import { ListMyFavoritesPaginatedUseCase } from '../../application/use-cases/list-my-favorites-paginated.use-case';
import { AddMyFavoriteUseCase } from '../../application/use-cases/add-my-favorite.use-case';
import { RemoveMyFavoriteUseCase } from '../../application/use-cases/remove-my-favorite.use-case';

@Controller('users/me')
export class UsersController {
  constructor(
    @Inject(GetMyProfileUseCase) private readonly getMyProfileUseCase: GetMyProfileUseCase,
    @Inject(UpdateMyProfileUseCase) private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    @Inject(ChangeMyPasswordUseCase) private readonly changeMyPasswordUseCase: ChangeMyPasswordUseCase,
    @Inject(GetMyAddressUseCase) private readonly getMyAddressUseCase: GetMyAddressUseCase,
    @Inject(ListMyAddressesUseCase) private readonly listMyAddressesUseCase: ListMyAddressesUseCase,
    @Inject(CreateMyAddressUseCase) private readonly createMyAddressUseCase: CreateMyAddressUseCase,
    @Inject(UpdateMyAddressUseCase) private readonly updateMyAddressUseCase: UpdateMyAddressUseCase,
    @Inject(DeleteMyAddressByIdUseCase) private readonly deleteMyAddressByIdUseCase: DeleteMyAddressByIdUseCase,
    @Inject(UpsertMyAddressUseCase) private readonly upsertMyAddressUseCase: UpsertMyAddressUseCase,
    @Inject(DeleteMyAddressUseCase) private readonly deleteMyAddressUseCase: DeleteMyAddressUseCase,
    @Inject(ListMyFavoritesUseCase) private readonly listMyFavoritesUseCase: ListMyFavoritesUseCase,
    @Inject(ListMyFavoritesPaginatedUseCase)
    private readonly listMyFavoritesPaginatedUseCase: ListMyFavoritesPaginatedUseCase,
    @Inject(AddMyFavoriteUseCase) private readonly addMyFavoriteUseCase: AddMyFavoriteUseCase,
    @Inject(RemoveMyFavoriteUseCase) private readonly removeMyFavoriteUseCase: RemoveMyFavoriteUseCase,
  ) {}

  @Get('profile')
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.getMyProfileUseCase.execute(user.sub);
  }

  @Put('profile')
  updateMyProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.updateMyProfileUseCase.execute(user.sub, dto);
  }

  @Put('password')
  changeMyPassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.changeMyPasswordUseCase.execute(user.sub, dto);
  }

  @Get('address')
  getMyAddress(@CurrentUser() user: JwtPayload) {
    return this.getMyAddressUseCase.execute(user.sub);
  }

  @Get('addresses')
  listMyAddresses(
    @CurrentUser() user: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.listMyAddressesUseCase.execute(user.sub, page, limit);
  }

  @Post('addresses')
  createMyAddress(@CurrentUser() user: JwtPayload, @Body() dto: UpsertAddressDto) {
    return this.createMyAddressUseCase.execute(user.sub, dto);
  }

  @Put('addresses/:addressId')
  updateMyAddress(
    @CurrentUser() user: JwtPayload,
    @Param('addressId') addressId: string,
    @Body() dto: UpsertAddressDto,
  ) {
    return this.updateMyAddressUseCase.execute(user.sub, addressId, dto);
  }

  @Delete('addresses/:addressId')
  deleteMyAddressById(@CurrentUser() user: JwtPayload, @Param('addressId') addressId: string) {
    return this.deleteMyAddressByIdUseCase.execute(user.sub, addressId);
  }

  @Put('address')
  upsertMyAddress(@CurrentUser() user: JwtPayload, @Body() dto: UpsertAddressDto) {
    return this.upsertMyAddressUseCase.execute(user.sub, dto);
  }

  @Delete('address')
  deleteMyAddress(@CurrentUser() user: JwtPayload) {
    return this.deleteMyAddressUseCase.execute(user.sub);
  }

  @Get('favorites')
  listMyFavorites(
    @CurrentUser() user: JwtPayload,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    if (page !== undefined || limit !== undefined) {
      return this.listMyFavoritesPaginatedUseCase.execute(user.sub, page, limit);
    }
    return this.listMyFavoritesUseCase.execute(user.sub);
  }

  @Post('favorites')
  addMyFavorite(@CurrentUser() user: JwtPayload, @Body() dto: AddFavoriteDto) {
    return this.addMyFavoriteUseCase.execute(user.sub, dto.productId);
  }

  @Delete('favorites/:productId')
  removeMyFavorite(@CurrentUser() user: JwtPayload, @Param('productId') productId: string) {
    return this.removeMyFavoriteUseCase.execute(user.sub, productId);
  }
}
