import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateArticleUsernames() {
  console.log('Starting migration: Adding usernames to articles...');
  
  try {
    // Find all articles without authorUsername
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { authorUsername: null },
          { authorUsername: '' }
        ]
      },
      include: {
        author: {
          select: {
            username: true
          }
        }
      }
    });

    console.log(`Found ${articles.length} articles to update`);

    // Update each article with the author's username
    let updatedCount = 0;
    for (const article of articles) {
      if (article.author?.username) {
        await prisma.article.update({
          where: { id: article.id },
          data: {
            authorUsername: article.author.username
          }
        });
        updatedCount++;
      } else {
        console.warn(`Article ${article.id} has no author with username`);
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} articles.`);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateArticleUsernames();
