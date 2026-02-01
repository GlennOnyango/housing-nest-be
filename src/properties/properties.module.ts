import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AmenitiesController } from './amenities.controller';
import { AmenitiesService } from './amenities.service';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';

@Module({
  imports: [AuditModule],
  controllers: [PropertiesController, UnitsController, AmenitiesController],
  providers: [PropertiesService, UnitsService, AmenitiesService],
})
export class PropertiesModule {}
