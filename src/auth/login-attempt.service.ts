import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MAX_LOCK_MINUTES = 15;
const BASE_LOCK_MINUTES = 1;
const FAILURE_THRESHOLD = 5;

@Injectable()
export class LoginAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async registerFailure(userId: string): Promise<void> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: {
          increment: 1,
        },
      },
      select: {
        failedLoginCount: true,
      },
    });

    if (user.failedLoginCount < FAILURE_THRESHOLD) {
      return;
    }

    const exponent = user.failedLoginCount - FAILURE_THRESHOLD;
    const minutes = Math.min(
      MAX_LOCK_MINUTES,
      BASE_LOCK_MINUTES * Math.pow(2, exponent),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(Date.now() + minutes * 60_000),
      },
    });
  }

  async reset(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
  }
}
