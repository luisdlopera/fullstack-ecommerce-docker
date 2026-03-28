import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../../application/users.service';

const usersServiceMock = {
  getMyProfile: jest.fn(),
  updateMyProfile: jest.fn(),
  changeMyPassword: jest.fn(),
  listMyFavorites: jest.fn(),
  addMyFavorite: jest.fn(),
  removeMyFavorite: jest.fn(),
  getMyAddress: jest.fn(),
  upsertMyAddress: jest.fn(),
  deleteMyAddress: jest.fn(),
};

describe('UsersController integration', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('forwards current user id for profile operations', async () => {
    const user = { sub: 'user-1' } as { sub: string };
    usersServiceMock.getMyProfile.mockResolvedValue({ id: 'user-1' });
    usersServiceMock.updateMyProfile.mockResolvedValue({ id: 'user-1', name: 'Nuevo' });

    await controller.getMyProfile(user as never);
    await controller.updateMyProfile(user as never, { name: 'Nuevo' });

    expect(usersServiceMock.getMyProfile).toHaveBeenCalledWith('user-1');
    expect(usersServiceMock.updateMyProfile).toHaveBeenCalledWith('user-1', { name: 'Nuevo' });
  });

  it('forwards favorite operations with user id and product id', async () => {
    const user = { sub: 'user-1' } as { sub: string };
    usersServiceMock.addMyFavorite.mockResolvedValue([]);
    usersServiceMock.removeMyFavorite.mockResolvedValue({ ok: true });

    await controller.addMyFavorite(user as never, { productId: 'product-1' });
    await controller.removeMyFavorite(user as never, 'product-1');

    expect(usersServiceMock.addMyFavorite).toHaveBeenCalledWith('user-1', 'product-1');
    expect(usersServiceMock.removeMyFavorite).toHaveBeenCalledWith('user-1', 'product-1');
  });
});
