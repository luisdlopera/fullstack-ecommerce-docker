import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from '../../domain/ports/auth-repository.port';
import { AuthMessages } from '../../domain/enums/auth-messages.enum';

export type AuthUserPayload = {
  id: string;
  name: string;
  email: string;
  role: Role;
  roles: Role[];
  permissions: string[];
};

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepositoryPort,
  ) {}

  async execute(userId: string): Promise<AuthUserPayload> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException(AuthMessages.USER_NOT_FOUND);
    }

    const rolePermissions = await this.authRepository.listRolePermissions(user.role);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roles: [user.role],
      permissions: rolePermissions,
    };
  }
}
