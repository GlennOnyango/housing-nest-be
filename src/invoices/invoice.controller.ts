import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { RequireRole } from '../common/auth/roles.decorator';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto';
import { InvoiceLinkService } from './invoice-link.service';
import { InvoiceService } from './invoice.service';

@ApiTags('invoices')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoiceLinkService: InvoiceLinkService,
  ) {}

  @Post('orgs/:orgId/invoices/generate')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async generate(
    @Param('orgId') orgId: string,
    @Body() dto: GenerateInvoicesDto,
  ) {
    return this.invoiceService.generateForPeriod(orgId, dto.period);
  }

  @Post('orgs/:orgId/invoices/:invoiceId/link')
  @RequireRole('OWNER', 'AGENT', 'ADMIN')
  async createLink(
    @Param('orgId') orgId: string,
    @Param('invoiceId') invoiceId: string,
    @Query('ttlMinutes') ttlMinutes?: string,
  ) {
    await this.invoiceService.assertInvoiceOrg(invoiceId, orgId);
    return this.invoiceLinkService.createLink(
      invoiceId,
      ttlMinutes ? Number(ttlMinutes) : undefined,
    );
  }
}
