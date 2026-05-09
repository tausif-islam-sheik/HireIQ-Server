import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { Role } from "@prisma/client";
import { JwtPayload } from "../types";
import { logger } from "../lib/logger";
import { addEmailJob } from "../queues/emailQueue";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

interface LoginInput {
  email: string;
  password: string;
}

interface GoogleAuthInput {
  googleId: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatar: string | null;
    isVerified: boolean;
  };
}

const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN as string) || "7d",
  } as jwt.SignOptions);
};

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { name, email, password, role = Role.CANDIDATE } = input;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw Object.assign(new Error("An account with this email already exists"), {
        statusCode: 409,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isVerified: false,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`New user registered: ${user.email} (${user.role})`);

    // Send welcome email
    try {
      await addEmailJob({
        to: user.email,
        subject: "Welcome to HireIQ!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4f46e5;">Welcome to HireIQ, ${user.name}!</h1>
            <p>Your account has been created successfully.</p>
            <p>You can now:</p>
            <ul>
              <li>Browse and apply to jobs</li>
              <li>Upload your resume</li>
              <li>Get AI-powered job recommendations</li>
            </ul>
            <a href="${process.env.CLIENT_URL}/dashboard" 
               style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Go to Dashboard
            </a>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        `,
      });
      logger.info(`Welcome email queued for: ${user.email}`);
    } catch (emailError) {
      logger.error("Failed to queue welcome email:", emailError);
    }

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw Object.assign(new Error("Invalid email or password"), {
        statusCode: 401,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw Object.assign(new Error("Invalid email or password"), {
        statusCode: 401,
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    };
  },

  async googleAuth(input: GoogleAuthInput): Promise<AuthResponse> {
    const { googleId, name, email, avatar } = input;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { email },
          data: { googleId, avatar: avatar || user.avatar },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          googleId,
          avatar,
          role: Role.CANDIDATE,
          isVerified: true,
        },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`Google auth: ${user.email}`);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    };
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        phone: true,
        location: true,
        dateOfBirth: true,
        bio: true,
        jobTitle: true,
        experienceLevel: true,
        availability: true,
        expectedSalary: true,
        skills: true,
        linkedin: true,
        github: true,
        portfolio: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!user) {
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }

    return user;
  },
};
