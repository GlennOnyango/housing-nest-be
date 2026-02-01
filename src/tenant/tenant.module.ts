import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';
import { ServiceProvidersController } from './service-providers.controller';
import { ServiceProvidersService } from './service-providers.service';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [AuditModule],
  controllers: [
    TenantController,
    NoticesController,
    TicketsController,
    ServiceProvidersController,
  ],
  providers: [
    TenantService,
    NoticesService,
    TicketsService,
    ServiceProvidersService,
  ],
})
export class TenantModule {}
