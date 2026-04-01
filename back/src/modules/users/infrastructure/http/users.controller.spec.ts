import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
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

const getMyProfileUseCase = { execute: jest.fn() };
const updateMyProfileUseCase = { execute: jest.fn() };
const changeMyPasswordUseCase = { execute: jest.fn() };
const getMyAddressUseCase = { execute: jest.fn() };
const listMyAddressesUseCase = { execute: jest.fn() };
const createMyAddressUseCase = { execute: jest.fn() };
const updateMyAddressUseCase = { execute: jest.fn() };
const deleteMyAddressByIdUseCase = { execute: jest.fn() };
const upsertMyAddressUseCase = { execute: jest.fn() };
const deleteMyAddressUseCase = { execute: jest.fn() };
const listMyFavoritesUseCase = { execute: jest.fn() };
const listMyFavoritesPaginatedUseCase = { execute: jest.fn() };
const addMyFavoriteUseCase = { execute: jest.fn() };
const removeMyFavoriteUseCase = { execute: jest.fn() };

describe('UsersController integration', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: GetMyProfileUseCase, useValue: getMyProfileUseCase },
        { provide: UpdateMyProfileUseCase, useValue: updateMyProfileUseCase },
        { provide: ChangeMyPasswordUseCase, useValue: changeMyPasswordUseCase },
        { provide: GetMyAddressUseCase, useValue: getMyAddressUseCase },
        { provide: ListMyAddressesUseCase, useValue: listMyAddressesUseCase },
        { provide: CreateMyAddressUseCase, useValue: createMyAddressUseCase },
        { provide: UpdateMyAddressUseCase, useValue: updateMyAddressUseCase },
        { provide: DeleteMyAddressByIdUseCase, useValue: deleteMyAddressByIdUseCase },
        { provide: UpsertMyAddressUseCase, useValue: upsertMyAddressUseCase },
        { provide: DeleteMyAddressUseCase, useValue: deleteMyAddressUseCase },
        { provide: ListMyFavoritesUseCase, useValue: listMyFavoritesUseCase },
        { provide: ListMyFavoritesPaginatedUseCase, useValue: listMyFavoritesPaginatedUseCase },
        { provide: AddMyFavoriteUseCase, useValue: addMyFavoriteUseCase },
        { provide: RemoveMyFavoriteUseCase, useValue: removeMyFavoriteUseCase },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('forwards current user id for profile operations', async () => {
    const user = { sub: 'user-1' } as { sub: string };
    getMyProfileUseCase.execute.mockResolvedValue({ id: 'user-1' });
    updateMyProfileUseCase.execute.mockResolvedValue({ id: 'user-1', name: 'Nuevo' });

    await controller.getMyProfile(user as never);
    await controller.updateMyProfile(user as never, { name: 'Nuevo' });

    expect(getMyProfileUseCase.execute).toHaveBeenCalledWith('user-1');
    expect(updateMyProfileUseCase.execute).toHaveBeenCalledWith('user-1', { name: 'Nuevo' });
  });

  it('forwards favorite operations with user id and product id', async () => {
    const user = { sub: 'user-1' } as { sub: string };
    addMyFavoriteUseCase.execute.mockResolvedValue([]);
    removeMyFavoriteUseCase.execute.mockResolvedValue({ ok: true });

    await controller.addMyFavorite(user as never, { productId: 'product-1' });
    await controller.removeMyFavorite(user as never, 'product-1');

    expect(addMyFavoriteUseCase.execute).toHaveBeenCalledWith('user-1', 'product-1');
    expect(removeMyFavoriteUseCase.execute).toHaveBeenCalledWith('user-1', 'product-1');
  });
});
