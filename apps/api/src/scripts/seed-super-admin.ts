import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { hashPassword } from '../utils/crypto';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { PasswordPolicySchema } from '@laps/shared';
import { seedRbac } from './seed-rbac';

export async function seedSuperAdmin(): Promise<void> {
  await connectDatabase();

  logger.info('Checking for SUPER_ADMIN role...');
  let role = await Role.findOne({ schoolId: 'LAPS-GOHAD', code: 'SUPER_ADMIN' });
  if (!role) {
    logger.info('SUPER_ADMIN role not found. Seeding RBAC roles first...');
    await seedRbac();
    role = await Role.findOne({ schoolId: 'LAPS-GOHAD', code: 'SUPER_ADMIN' });
  }

  if (!role) {
    throw new Error('Failed to create or locate SUPER_ADMIN role.');
  }

  const identifier = env.SUPER_ADMIN_IDENTIFIER.trim().toLowerCase();
  const passwordSeed = env.SUPER_ADMIN_PASSWORD_SEED;

  // Enforce NIST SP 800-63B policy on password seed
  PasswordPolicySchema.parse(passwordSeed);

  const passwordHash = await hashPassword(passwordSeed);

  logger.info({ identifier }, 'Seeding or updating SUPER_ADMIN user account...');

  await User.findOneAndUpdate(
    {
      schoolId: 'LAPS-GOHAD',
      identifier,
    },
    {
      $set: {
        schoolId: 'LAPS-GOHAD',
        identifier,
        email: identifier.includes('@') ? identifier : undefined,
        passwordHash,
        roleId: role._id,
        roleCode: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN',
        status: 'ACTIVE',
        passwordChangedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  logger.info(
    '✅ SUPER_ADMIN user seeded successfully. Please change the seed password in production!',
  );
}

if (require.main === module) {
  seedSuperAdmin()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, '❌ Error seeding SUPER_ADMIN account');
      await disconnectDatabase();
      process.exit(1);
    });
}
