import { PrismaClient, UnitStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
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
