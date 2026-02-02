import { PrismaClient, UnitStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const adminBootstrapEnabled = process.env.ADMIN_BOOTSTRAP_ENABLED === 'true';
  if (adminBootstrapEnabled && adminEmail && adminPassword) {
    const passwordHash = await argon2.hash(adminPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        isPlatformAdmin: true,
      },
      create: {
        email: adminEmail,
        passwordHash,
        isPlatformAdmin: true,
      },
    });
  }

  const ownerEmail = 'owner@example.com';

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      passwordHash: 'seeded-password-hash',
      profile: {
        create: {
          firstName: 'Owner',
          lastName: 'User',
          phone: '+15550001111',
        },
      },
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: `Demo Org ${randomUUID().slice(0, 8)}`,
      ownerUserId: owner.id,
      memberships: {
        create: {
          userId: owner.id,
          role: 'OWNER',
        },
      },
    },
  });

  const property = await prisma.property.create({
    data: {
      orgId: org.id,
      name: 'Sample Property',
      city: 'Nairobi',
    },
  });

  await prisma.houseUnit.create({
    data: {
      orgId: org.id,
      propertyId: property.id,
      unitLabel: 'A1',
      floor: 1,
      status: UnitStatus.AVAILABLE,
      rent: '450.00',
      deposit: '450.00',
      serviceCharge: '50.00',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
