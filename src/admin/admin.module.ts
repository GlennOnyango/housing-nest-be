import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthService } from './admin-auth.service';
import { AdminController } from './admin.controller';
import { AdminJwtGuard } from './admin-jwt.guard';
import { AdminService } from './admin.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET ?? 'change-me-admin',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminAuthService, AdminService, AdminJwtGuard],
})
export class AdminModule {}
