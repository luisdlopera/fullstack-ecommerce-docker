import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { UsersController } from './infrastructure/http/users.controller';
import { USERS_REPOSITORY } from './domain/ports/users-repository.port';
import { PrismaUsersRepository } from './infrastructure/persistence/prisma-users.repository';
import { GetMyProfileUseCase } from './application/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from './application/use-cases/update-my-profile.use-case';
import { ChangeMyPasswordUseCase } from './application/use-cases/change-my-password.use-case';
import { GetMyAddressUseCase } from './application/use-cases/get-my-address.use-case';
import { ListMyAddressesUseCase } from './application/use-cases/list-my-addresses.use-case';
import { CreateMyAddressUseCase } from './application/use-cases/create-my-address.use-case';
import { UpdateMyAddressUseCase } from './application/use-cases/update-my-address.use-case';
import { DeleteMyAddressByIdUseCase } from './application/use-cases/delete-my-address-by-id.use-case';
import { UpsertMyAddressUseCase } from './application/use-cases/upsert-my-address.use-case';
import { DeleteMyAddressUseCase } from './application/use-cases/delete-my-address.use-case';
import { ListMyFavoritesUseCase } from './application/use-cases/list-my-favorites.use-case';
import { ListMyFavoritesPaginatedUseCase } from './application/use-cases/list-my-favorites-paginated.use-case';
import { AddMyFavoriteUseCase } from './application/use-cases/add-my-favorite.use-case';
import { RemoveMyFavoriteUseCase } from './application/use-cases/remove-my-favorite.use-case';

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [
    { provide: USERS_REPOSITORY, useClass: PrismaUsersRepository },
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    ChangeMyPasswordUseCase,
    GetMyAddressUseCase,
    ListMyAddressesUseCase,
    CreateMyAddressUseCase,
    UpdateMyAddressUseCase,
    DeleteMyAddressByIdUseCase,
    UpsertMyAddressUseCase,
    DeleteMyAddressUseCase,
    ListMyFavoritesUseCase,
    ListMyFavoritesPaginatedUseCase,
    AddMyFavoriteUseCase,
    RemoveMyFavoriteUseCase,
  ],
})
export class UsersModule {}
