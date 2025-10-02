# Username-based URL Migration Guide

This guide explains the changes made to implement username-based URLs for articles and how to migrate existing data.

## Changes Made

1. **Database Schema Updates**:
   - Added `username` field to the `User` model (required, unique)
   - Added `authorUsername` field to the `Article` model
   - Updated unique constraints to ensure slug uniqueness per user

2. **New URL Structure**:
   - Old: `/articles/article-slug`
   - New: `/username/article-slug`

3. **Updated Components**:
   - Registration form now includes username field
   - Article creation form validates slug uniqueness per user
   - Article pages use the new URL structure

## Migration Steps

1. **Run the migration script** to update existing articles with author usernames:

   ```bash
   npx tsx scripts/migrate-article-usernames.js
   ```

2. **Update any hardcoded URLs** in your codebase to use the new format: `/{username}/{article-slug}`

3. **Set up redirects** (if needed) from old URLs to new ones in your Next.js config or at the web server level.

## New User Registration

New users will be required to choose a username during registration. The username:
- Must be 3-30 characters long
- Can only contain letters, numbers, and underscores
- Must be unique across the platform

## Article URL Uniqueness

Article slugs must now be unique per user. For example:
- `user1/my-article` and `user2/my-article` are both valid
- A single user cannot have multiple articles with the same slug

## Backward Compatibility

If you need to maintain backward compatibility with old URLs, you can implement a catch-all route that looks up articles by slug and redirects to the new URL.
