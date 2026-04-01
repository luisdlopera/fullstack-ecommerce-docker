import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcryptjs from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { EmailService } from '../../../shared/infrastructure/email/email.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  rolePermission: {
    findMany: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  emailVerificationToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verifyAsync: jest.fn(),
};

const mockEmailService = {
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerificationEmail: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.EMAIL_MX_REQUIRED = 'false';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockPrisma.rolePermission.findMany.mockResolvedValue([]);
  });

  describe('register', () => {
    it('should create a new user and return verification pending response', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        name: 'Test',
        email: 'test@test.com',
        role: 'CUSTOMER',
      });
      mockPrisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.emailVerificationToken.create.mockResolvedValue({});
      mockEmailService.sendEmailVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register({
        name: 'Test',
        email: 'test@test.com',
        password: 'StrongPass.123',
      });

      expect(result.ok).toBe(true);
      expect(result.message).toContain('verification');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendEmailVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          name: 'Test',
          email: 'test@test.com',
          password: 'StrongPass.123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test',
        email: 'test@test.com',
        password: bcryptjs.hashSync('password123', 10),
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: new Date(),
        mfaEnabled: false,
        mfaSecret: null,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.refreshToken.updateMany.mockResolvedValue({});

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@test.com');
      expect(result.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password: bcryptjs.hashSync('password123', 10),
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: new Date(),
        mfaEnabled: false,
        mfaSecret: null,
      });

      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'unknown@test.com', password: 'password123' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh tokens for user', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-1');

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should delete specific refresh token if provided', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-1', 'specific-token');

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          revokedAt: null,
          OR: [
            { tokenHash: expect.any(String) },
            { token: 'specific-token' },
          ],
        },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should always return ok for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('unknown@test.com');

      expect(result.ok).toBe(true);
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should create token and send email for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        isActive: true,
      });
      mockPrisma.passwordResetToken.create.mockResolvedValue({});
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@test.com');

      expect(result.ok).toBe(true);
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetPassword', () => {
    it('should throw for invalid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword('bad-token', 'password123')).rejects.toThrow(UnauthorizedException);
    });

    it('should reset password and revoke sessions', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'user-1', isActive: true },
      });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await service.resetPassword('valid-token', 'password123');

      expect(result).toEqual({ ok: true });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
