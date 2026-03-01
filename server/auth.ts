import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { storage } from './storage';
// Note: We're using our custom DbUser interface instead of importing User from schema
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

// Import the User type from shared schema
import { User } from "@shared/schema";

// Define a type for database user that matches exactly what comes back from the database
interface DbUser {
  id: number;
  username: string;
  password: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_agent: boolean;
  created_at: Date;
  role: string | null;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  verification_token: string | null;
  verification_expires: Date | null;
  last_login: Date | null;
}

// Extend Express types to include user - using the schema's User type
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      password: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      isAgent: boolean | null;
      createdAt: Date | null;
      role: string | null;
      isEmailVerified: boolean | null;
      isPhoneVerified: boolean | null;
      verificationToken: string | null;
      verificationExpires: Date | null;
      lastLogin: Date | null;
    }
  }
}

// Helper function to convert DB user to application User format
function dbUserToAppUser(dbUser: DbUser): Express.User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    password: dbUser.password,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    isAgent: dbUser.is_agent,
    createdAt: dbUser.created_at,
    role: dbUser.role || (dbUser.is_agent ? 'agent' : 'buyer'),
    isEmailVerified: dbUser.is_email_verified,
    isPhoneVerified: dbUser.is_phone_verified,
    verificationToken: dbUser.verification_token,
    verificationExpires: dbUser.verification_expires,
    lastLogin: dbUser.last_login
  };
}

// Helper function to convert application User to DB user format
function appUserToDbUser(appUser: Express.User): DbUser {
  return {
    id: appUser.id,
    username: appUser.username,
    password: appUser.password,
    email: appUser.email,
    first_name: appUser.firstName,
    last_name: appUser.lastName,
    is_agent: appUser.isAgent === true,
    created_at: appUser.createdAt || new Date(),
    role: appUser.role,
    is_email_verified: appUser.isEmailVerified === true,
    is_phone_verified: appUser.isPhoneVerified === true,
    verification_token: appUser.verificationToken,
    verification_expires: appUser.verificationExpires,
    last_login: appUser.lastLogin
  };
}

// Promisify scrypt for hashing passwords
const scryptAsync = promisify(scrypt);

// Hash password with salt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Verify password against stored hash
export async function verifyPassword(supplied: string, stored: string): Promise<boolean> {
  try {
    // Make sure we have a valid stored password with correct format
    if (!stored || !stored.includes('.')) {
      console.error('Invalid stored password format');
      return false;
    }

    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Setup authentication with passport and user sessions
export function setupAuth(app: Express) {
  // Session configuration
  const sessionSettings: session.SessionOptions = {
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'terra-nova-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  // Set trust proxy if in production
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Setup session middleware
  app.use(session(sessionSettings));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        if (!username || !password) {
          return done(null, false, { message: 'Username and password are required' });
        }

        // Normalize username/email for case-insensitive search
        const normalizedIdentifier = username.toLowerCase().trim();

        // Try to match against all users using case-insensitive comparison
        const allUsers = await storage.getUsersByRole('*');
        const matchedUser = allUsers.find(u => 
          u.username.toLowerCase() === normalizedIdentifier || 
          u.email.toLowerCase() === normalizedIdentifier
        );

        if (!matchedUser) {
          return done(null, false, { message: 'Incorrect username or password' });
        }

        // Verify password
        if (!(await verifyPassword(password, matchedUser.password))) {
          return done(null, false, { message: 'Incorrect username or password' });
        }

        // We'll implement this in the storage class
        if (typeof storage.updateUserLastLogin === 'function') {
          await storage.updateUserLastLogin(matchedUser.id);
        }

        // Convert DB user to application user using helper function
        // Use double casting to avoid TypeScript errors with differing object shapes
        const normalizedUser = dbUserToAppUser(matchedUser as unknown as DbUser);

        return done(null, normalizedUser);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }),
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);

      // If we got a user, convert it to application user format
      if (user) {
        // Use the mapper function to convert DbUser to User
        // Use double casting to avoid TypeScript errors with differing object shapes
        const appUser = dbUserToAppUser(user as unknown as DbUser);
        done(null, appUser);
      } else {
        done(null, null);
      }
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error);
    }
  });

  // Authentication routes

  // Register new user
  app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate required fields
      if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).json({ 
          message: 'Missing required fields', 
          details: 'Username, email and password are required'
        });
      }

      // Normalize username and email to lowercase for case-insensitive comparison
      const normalizedUsername = req.body.username.toLowerCase().trim();
      const normalizedEmail = req.body.email.toLowerCase().trim();

      // Check if username already exists (case-insensitive)
      // Since our storage implementation might not support case-insensitive search
      // we'll do an additional check here
      const allUsers = await storage.getUsersByRole('*'); // Get all users, regardless of role
      const usernameExists = allUsers.some(u => u.username.toLowerCase() === normalizedUsername);
      if (usernameExists) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Check if email already exists (case-insensitive)
      const emailExists = allUsers.some(u => u.email.toLowerCase() === normalizedEmail);
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);

      // Properly handle and validate role
      const validRoles = ['buyer', 'seller', 'agent'];
      let role = (req.body.role && validRoles.includes(req.body.role)) 
        ? req.body.role 
        : 'buyer'; // Default to buyer if no valid role is provided

      // Map the role to isAgent value - only 'agent' role should set isAgent to true
      const isAgent = role === 'agent';

      console.log(`Creating user with role: ${role} (isAgent: ${isAgent})`);

      // Generate verification token
      const verificationToken = randomBytes(32).toString('hex');
      const now = new Date();
      const verificationExpires = new Date(now.setDate(now.getDate() + 1)); // 24 hours from now

      // Create user in the application format
      const appUser: Express.User = {
        id: 0, // This will be assigned by the database
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        firstName: req.body.firstName || null,
        lastName: req.body.lastName || null,
        isAgent: isAgent,
        createdAt: new Date(),
        role: role, // Always use the validated role
        isEmailVerified: false,
        isPhoneVerified: false,
        verificationToken: verificationToken,
        verificationExpires: verificationExpires,
        lastLogin: null
      };

      // Convert to database format
      const dbUser = appUserToDbUser(appUser);

      // Create user in the database
      const newUser = await storage.createUser(dbUser);

      // Convert the returned database user to application format for response
      const createdAppUser = dbUserToAppUser(newUser as unknown as DbUser);

      // Log user in after verifying user was created
      if (createdAppUser) {
        req.login(createdAppUser, (err) => {
          if (err) return next(err);
          // Return user data without password
          const { password, ...userWithoutPassword } = createdAppUser;
          res.status(201).json(userWithoutPassword);
        });
      } else {
        res.status(500).json({ message: 'Failed to create user' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  // Login
  app.post('/api/auth/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: Error, user: Express.User, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Authentication failed' });
      }

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error during logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user
  app.get('/api/auth/me', (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json(req.user);
  });

  // Verify email with token
  app.post('/api/auth/verify/email', async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(404).json({ message: 'Invalid verification token' });
      }

      // Check if token is expired
      if (user.verificationExpires && new Date() > user.verificationExpires) {
        return res.status(400).json({ message: 'Verification token has expired' });
      }

      // Mark email as verified and clear verification token
      await storage.updateUser(user.id, {
        isEmailVerified: true,
        verificationToken: null,
        verificationExpires: null
      });

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Server error during verification' });
    }
  });

  // Resend verification email (generates new token)
  app.post('/api/auth/verify/resend', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = req.user as Express.User;

      // Generate new verification token
      const verificationToken = randomBytes(32).toString('hex');
      const now = new Date();
      const verificationExpires = new Date(now.setDate(now.getDate() + 1)); // 24 hours from now

      // Update user with new token
      await storage.updateUser(user.id, {
        verificationToken: verificationToken,
        verificationExpires: verificationExpires
      });

      // In a real application, you would send an email with the token here
      // For now, we'll just return the token in the response for testing
      res.json({ 
        message: 'Verification email sent',
        token: verificationToken // This would normally be sent via email, not in the response
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Server error during verification' });
    }
  });
}

// Middleware for checking role
export function requireRole(role: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = req.user as Express.User;
    const roles = Array.isArray(role) ? role : [role];

    // Get the user's role from their profile
    // Default roles: 'buyer', 'seller', 'agent'
    let userRole: string;

    // Use explicit role if it exists
    if (user.role) {
      userRole = user.role;
    } 
    // Fall back to isAgent flag as secondary check
    else if (user.isAgent) {
      userRole = 'agent';
    } 
    // Default to buyer
    else {
      userRole = 'buyer';
    }

    console.log(`User role check: ${userRole}, Required roles: ${roles.join(', ')}`);

    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. This area requires ${roles.join(' or ')} role, but your role is ${userRole}.`
      });
    }

    next();
  };
}

// Middleware to require verified email
export function requireVerifiedEmail() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = req.user as Express.User;

    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Email verification required',
        verificationRequired: true
      });
    }

    next();
  };
}

// Middleware to require verified phone
export function requireVerifiedPhone() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = req.user as Express.User;

    if (!user.isPhoneVerified) {
      return res.status(403).json({ 
        message: 'Phone verification required',
        verificationRequired: true
      });
    }

    next();
  };
}