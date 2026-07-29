import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { hashPassword } from '../utils/crypto';
import { logger } from '../config/logger';
import { seedRbac } from './seed-rbac';

export async function seedSampleUsers(): Promise<void> {
  await connectDatabase();

  logger.info('Ensuring RBAC roles are present...');
  await seedRbac();

  const roles = await Role.find({ schoolId: 'LAPS-GOHAD' });
  const roleMap = new Map(roles.map((r) => [r.code, r._id]));

  const sampleUsers = [
    {
      identifier: 'student@littleangelsschool.edu.in',
      email: 'student@littleangelsschool.edu.in',
      passwordSeed: 'StudentDemo10!',
      roleCode: 'STUDENT' as const,
      userType: 'STUDENT' as const,
    },
    {
      identifier: 'teacher@littleangelsschool.edu.in',
      email: 'teacher@littleangelsschool.edu.in',
      passwordSeed: 'TeacherDemo10!',
      roleCode: 'TEACHER' as const,
      userType: 'TEACHER' as const,
    },
    {
      identifier: 'principal@littleangelsschool.edu.in',
      email: 'principal@littleangelsschool.edu.in',
      passwordSeed: 'PrincipalDemo10!',
      roleCode: 'SCHOOL_ADMIN' as const,
      userType: 'SCHOOL_ADMIN' as const,
    },
  ];

  for (const sample of sampleUsers) {
    const roleId = roleMap.get(sample.roleCode);
    if (!roleId) {
      logger.error(`Role code ${sample.roleCode} not found! Skipping...`);
      continue;
    }

    const passwordHash = await hashPassword(sample.passwordSeed);

    await User.findOneAndUpdate(
      {
        schoolId: 'LAPS-GOHAD',
        identifier: sample.identifier,
      },
      {
        $set: {
          schoolId: 'LAPS-GOHAD',
          identifier: sample.identifier,
          email: sample.email,
          passwordHash,
          roleId,
          roleCode: sample.roleCode,
          userType: sample.userType,
          status: 'ACTIVE',
          passwordChangedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    logger.info(`✅ Sample ${sample.roleCode} seeded: ${sample.identifier}`);
  }

  logger.info('✅ All sample users seeded successfully.');
}

if (require.main === module) {
  seedSampleUsers()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, '❌ Error seeding sample users');
      await disconnectDatabase();
      process.exit(1);
    });
}
