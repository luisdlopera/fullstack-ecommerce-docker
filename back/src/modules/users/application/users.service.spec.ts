import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import bcryptjs from 'bcryptjs';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  country: {
    findUnique: jest.fn(),
  },
  userAddress: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
  },
  userFavorite: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('changeMyPassword', () => {
    it('updates password when current password is valid', async () => {
      const hashed = bcryptjs.hashSync('Current.123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', password: hashed });
      mockPrisma.user.update.mockResolvedValue({ id: 'u1' });

      const result = await service.changeMyPassword('u1', {
        currentPassword: 'Current.123',
        newPassword: 'NewPass.456',
      });

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
    });

    it('throws when new password equals current password', async () => {
      await expect(
        service.changeMyPassword('u1', {
          currentPassword: 'SamePass.123',
          newPassword: 'SamePass.123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when current password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        password: bcryptjs.hashSync('RealPass.123', 10),
      });

      await expect(
        service.changeMyPassword('u1', {
          currentPassword: 'WrongPass.123',
          newPassword: 'NewPass.456',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('addMyFavorite', () => {
    it('throws when product does not exist', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.addMyFavorite('u1', 'p1')).rejects.toThrow(NotFoundException);
    });

    it('stores favorite and returns mapped list', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.userFavorite.upsert.mockResolvedValue({});
      mockPrisma.userFavorite.findMany.mockResolvedValue([
        {
          product: {
            id: 'p1',
            slug: 'product-1',
            title: 'Producto 1',
            price: 99,
            ProductImage: [{ url: '/img/a.png' }],
          },
        },
      ]);

      const result = await service.addMyFavorite('u1', 'p1');

      expect(mockPrisma.userFavorite.upsert).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          productId: 'p1',
          slug: 'product-1',
          title: 'Producto 1',
          price: 99,
          image: '/img/a.png',
        },
      ]);
    });
  });
});
