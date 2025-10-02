import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Helper function to validate username
function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

// Helper function to generate a unique username from name
async function generateUniqueUsername(name) {
  let baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 30);

  if (!baseUsername) baseUsername = 'user';
  
  let username = baseUsername;
  let counter = 1;
  
  // Check if username exists and append number if it does
  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });
    
    if (!existingUser) return username;
    
    // Try with appended number
    username = `${baseUsername}${counter}`.substring(0, 30);
    counter++;
  }
}

export async function POST(request) {
  try {
    const { name, email, password, username: providedUsername } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }), 
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: 'Email is already in use' }), 
        { status: 400 }
      );
    }
    
    // Generate username if not provided, otherwise validate it
    let username = providedUsername || await generateUniqueUsername(name);
    
    // If username was provided, validate it
    if (providedUsername) {
      if (!isValidUsername(providedUsername)) {
        return new Response(
          JSON.stringify({ 
            error: 'Username must be 3-30 characters long and can only contain letters, numbers, and underscores' 
          }), 
          { status: 400 }
        );
      }
      
      // Check if username is taken
      const existingUsername = await prisma.user.findUnique({
        where: { username: providedUsername },
        select: { id: true }
      });
      
      if (existingUsername) {
        return new Response(
          JSON.stringify({ error: 'Username is already taken' }), 
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User already exists' }), 
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role: 'USER',
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return new Response(
      JSON.stringify({ user: userWithoutPassword }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500 }
    );
  }
}
