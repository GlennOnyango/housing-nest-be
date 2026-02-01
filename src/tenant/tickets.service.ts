import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogService } from '../audit/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createTicket(userId: string, dto: CreateTicketDto) {
    const lease = await this.prisma.tenantLease.findFirst({
      where: { tenantUserId: userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!lease) {
      throw new ForbiddenException();
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        orgId: lease.orgId,
        houseUnitId: lease.houseUnitId,
        tenantUserId: userId,
        category: dto.category,
        description: dto.description,
        attachments: dto.attachments,
      },
    });

    await this.auditLogService.log({
      orgId: lease.orgId,
      actorUserId: userId,
      action: 'TICKET_CREATE',
      entity: 'Ticket',
      entityId: ticket.id,
    });

    return ticket;
  }

  async updateTicket(
    orgId: string,
    ticketId: string,
    actorUserId: string,
    dto: UpdateTicketDto,
  ) {
    const membership = await this.prisma.orgMembership.findFirst({
      where: { orgId, userId: actorUserId, deletedAt: null },
    });
    if (
      !membership ||
      (membership.role !== 'CARETAKER' &&
        membership.role !== 'AGENT' &&
        membership.role !== 'OWNER' &&
        membership.role !== 'ADMIN')
    ) {
      throw new ForbiddenException();
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, orgId },
    });
    if (!ticket) {
      throw new NotFoundException();
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: dto.status,
        assignedUserId: dto.assignedCaretakerId,
      },
    });

    await this.auditLogService.log({
      orgId,
      actorUserId,
      action: 'TICKET_UPDATE',
      entity: 'Ticket',
      entityId: ticket.id,
      meta: {
        status: dto.status,
        assignedCaretakerId: dto.assignedCaretakerId,
      },
    });

    return updated;
  }

  async listForCaretaker(
    orgId: string,
    userId: string,
    page: number,
    pageSize: number,
  ) {
    const membership = await this.prisma.orgMembership.findFirst({
      where: { orgId, userId, deletedAt: null },
    });
    if (
      !membership ||
      (membership.role !== 'CARETAKER' &&
        membership.role !== 'AGENT' &&
        membership.role !== 'OWNER' &&
        membership.role !== 'ADMIN')
    ) {
      throw new ForbiddenException();
    }

    const where = {
      orgId,
      OR: [{ assignedUserId: userId }, { assignedUserId: null }],
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
