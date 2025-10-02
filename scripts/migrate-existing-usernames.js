import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Reuse the same username generation functions from auth.js
const generateUsername = (email) => {
  let username = email.split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  if (username.length < 3) {
    username = username.padEnd(3, '_');
  }
  
  return username.substring(0, 30);
};

async function migrateUsernames() {
  console.log('Starting username migration for existing users...');
  
  try {
    // Find all users without a username
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: null },
          { username: '' }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true
      }
    });

    console.log(`Found ${users.length} users without usernames`);

    let updatedCount = 0;
    const usernames = new Set();

    // First, generate all usernames and check for duplicates
    const usersWithNewUsernames = users.map(user => {
      const baseUsername = generateUsername(user.email);
      let newUsername = baseUsername;
      let counter = 1;

      // Make sure username is unique in this batch
      while (usernames.has(newUsername)) {
        const suffix = counter.toString();
        newUsername = `${baseUsername.substring(0, 30 - suffix.length - 1)}_${suffix}`;
        counter++;
      }

      usernames.add(newUsername);
      return { ...user, newUsername };
    });

    // Now update the database
    for (const user of usersWithNewUsernames) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { username: user.newUsername }
        });
        console.log(`Updated user ${user.email} with username: ${user.newUsername}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating user ${user.email}:`, error.message);
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} users.`);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsernames();
