import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { PdfRendererService } from './pdf-renderer.service';

@Module({
  imports: [AuditModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, PdfRendererService],
})
export class OnboardingModule {}
