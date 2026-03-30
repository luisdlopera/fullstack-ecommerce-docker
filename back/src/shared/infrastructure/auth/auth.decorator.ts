import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from './permissions';

export const AUTH_PERMISSIONS_KEY = 'auth:permissions';

export const Auth = (...permissions: PermissionKey[]) => SetMetadata(AUTH_PERMISSIONS_KEY, permissions);
