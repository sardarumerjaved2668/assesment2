import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — route is accessible to any authenticated user
    if (!roles || roles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      // JwtAuthGuard should have already handled this, but guard defensively
      throw new ForbiddenException('Authentication required');
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
