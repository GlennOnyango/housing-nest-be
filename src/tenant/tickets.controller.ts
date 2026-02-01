import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { RequireRole } from '../common/auth/roles.decorator';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('tenant/me/tickets')
  @RequireRole('TENANT')
  async create(
    @Body() dto: CreateTicketDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.ticketsService.createTicket(req.user?.id ?? '', dto);
  }

  @Get('orgs/:orgId/tickets')
  @RequireRole('CARETAKER', 'AGENT', 'OWNER', 'ADMIN')
  async listOrgTickets(
    @Param('orgId') orgId: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Req() req: Request & { user?: { id: string } },
  ) {
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedPageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
    return this.ticketsService.listForCaretaker(
      orgId,
      req.user?.id ?? '',
      parsedPage,
      parsedPageSize,
    );
  }

  @Patch('orgs/:orgId/tickets/:ticketId')
  @RequireRole('CARETAKER', 'AGENT', 'OWNER', 'ADMIN')
  async update(
    @Param('orgId') orgId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateTicketDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.ticketsService.updateTicket(orgId, ticketId, req.user?.id ?? '', dto);
  }
}
