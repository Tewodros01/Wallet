import 'dotenv/config';
import { PrismaClient, Role } from 'generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error('Usage: pnpm make-admin <email>');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        deletedAt: true,
      },
    });

    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    const updatedUser =
      user.role === Role.ADMIN
        ? user
        : await prisma.user.update({
            where: { email },
            data: { role: Role.ADMIN },
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              deletedAt: true,
            },
          });

    console.log('User is now admin:');
    console.table([updatedUser]);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Failed to make user admin.');
  console.error(error);
  process.exit(1);
});
