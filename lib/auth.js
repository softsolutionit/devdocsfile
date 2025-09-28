import { auth } from "@/auth";


/**
 * Wrapper for `getServerSession` to avoid repeating the `authOptions` import.
 * @see https://next-auth.js.org/configuration/nextjs
 */
export async function getServerAuthSession() {
  try {
    const session = await auth();
    return session || null;
  } catch (error) {
    console.error('Error in getServerAuthSession:', error);
    return null;
  }
}
