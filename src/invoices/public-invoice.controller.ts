import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvoiceLinkService } from './invoice-link.service';

@ApiTags('public')
@Controller('public')
export class PublicInvoiceController {
  constructor(private readonly invoiceLinkService: InvoiceLinkService) {}

  @Get('invoice')
  async getInvoice(@Query('token') token: string) {
    return this.invoiceLinkService.verifyToken(token);
  }
}
