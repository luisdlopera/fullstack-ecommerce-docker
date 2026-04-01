import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AUTH_REPOSITORY } from '../domain/ports/auth-repository.port';
import { TOKEN_SERVICE } from '../domain/ports/token-service.port';
import { EMAIL_SENDER } from '../domain/ports/email-sender.port';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { ConflictError, UnauthorizedError } from '../../../shared/domain/errors/domain-error';

const mockAuthRepository = {
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  updateUserLastLogin: jest.fn(),
  listRolePermissions: jest.fn(),
  issueEmailVerificationToken: jest.fn(),
  findEmailVerificationToken: jest.fn(),
  completeEmailVerification: jest.fn(),
  createPasswordResetToken: jest.fn(),
  findPasswordResetToken: jest.fn(),
  completePasswordReset: jest.fn(),
  createRefreshToken: jest.fn(),
  findRefreshTokenByHash: jest.fn(),
  findRefreshTokenByToken: jest.fn(),
  updateRefreshToken: jest.fn(),
  rotateRefreshToken: jest.fn(),
  revokeRefreshTokensByUser: jest.fn(),
  revokeRefreshTokensByFamily: jest.fn(),
  revokeRefreshTokensByHash: jest.fn(),
  revokeRefreshTokensByToken: jest.fn(),
  revokeExpiredRefreshTokens: jest.fn(),
};

const mockTokenService = {
  signTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
  hashToken: jest.fn(),
};

const mockEmailSender = {
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerificationEmail: jest.fn(),
};

const mockRegisterUseCase = {
  execute: jest.fn(),
};

const mockLoginUseCase = {
  execute: jest.fn(),
};

const mockRefreshTokenUseCase = {
  execute: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.EMAIL_MX_REQUIRED = 'false';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
        { provide: TOKEN_SERVICE, useValue: mockTokenService },
        { provide: EMAIL_SENDER, useValue: mockEmailSender },
        { provide: RegisterUseCase, useValue: mockRegisterUseCase },
        { provide: LoginUseCase, useValue: mockLoginUseCase },
        { provide: RefreshTokenUseCase, useValue: mockRefreshTokenUseCase },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockAuthRepository.listRolePermissions.mockResolvedValue([]);
  });

  describe('register', () => {
    it('should create a new user and return verification pending response', async () => {
      mockRegisterUseCase.execute.mockResolvedValue({
        ok: true,
        message: 'We sent a verification email. Please verify your email before signing in.',
      });

      const result = await service.register({
        name: 'Test',
        email: 'test@test.com',
        password: 'StrongPass.123',
      });

      expect(result.ok).toBe(true);
      expect(result.message).toContain('verification');
      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith({
        name: 'Test',
        email: 'test@test.com',
        password: 'StrongPass.123',
      });
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockRegisterUseCase.execute.mockRejectedValue(new ConflictError('Email is already in use'));

      await expect(
        service.register({
          name: 'Test',
          email: 'test@test.com',
          password: 'StrongPass.123',
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      mockLoginUseCase.execute.mockResolvedValue({
        user: { email: 'test@test.com' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@test.com');
      expect(result.accessToken).toBe('access-token');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockLoginUseCase.execute.mockRejectedValue(new UnauthorizedError('Invalid email or password'));

      await expect(service.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      mockLoginUseCase.execute.mockRejectedValue(new UnauthorizedError('Invalid email or password'));

      await expect(service.login({ email: 'unknown@test.com', password: 'password123' })).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh tokens for user', async () => {
      const result = await service.logout('user-1');

      expect(result).toEqual({ ok: true });
      expect(mockAuthRepository.revokeRefreshTokensByUser).toHaveBeenCalledWith('user-1');
    });

    it('should delete specific refresh token if provided', async () => {
      const result = await service.logout('user-1', 'specific-token');

      expect(result).toEqual({ ok: true });
      expect(mockAuthRepository.revokeRefreshTokensByHash).toHaveBeenCalledWith('user-1', expect.any(String));
      expect(mockAuthRepository.revokeRefreshTokensByToken).toHaveBeenCalledWith('user-1', 'specific-token');
    });
  });

  describe('forgotPassword', () => {
    it('should always return ok for unknown email', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('unknown@test.com');

      expect(result.ok).toBe(true);
      expect(mockEmailSender.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should create token and send email for existing user', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        isActive: true,
      });
      mockAuthRepository.createPasswordResetToken.mockResolvedValue(undefined);
      mockEmailSender.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@test.com');

      expect(result.ok).toBe(true);
      expect(mockAuthRepository.createPasswordResetToken).toHaveBeenCalledTimes(1);
      expect(mockEmailSender.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('resetPassword', () => {
    it('should throw for invalid token', async () => {
      mockAuthRepository.findPasswordResetToken.mockResolvedValue(null);

      await expect(service.resetPassword('bad-token', 'password123')).rejects.toThrow(UnauthorizedException);
    });

    it('should reset password and revoke sessions', async () => {
      mockAuthRepository.findPasswordResetToken.mockResolvedValue({
        id: 'prt-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'user-1', isActive: true },
      });

      mockAuthRepository.completePasswordReset.mockResolvedValue(undefined);

      const result = await service.resetPassword('valid-token', 'password123');

      expect(result).toEqual({ ok: true });
      expect(mockAuthRepository.completePasswordReset).toHaveBeenCalledTimes(1);
    });
  });
});
