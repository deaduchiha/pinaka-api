import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { hashPassword, verifyPassword } from "../lib/password";

import type { DB } from "../db";
import { JwtService } from "../lib/jwt.service";

export interface JwtPayload {
  sub: string;
  role: string;
  mobile: string;
}

export interface AuthResponse {
  user: {
    id: string;
    mobile: string;
    name: string;
    role: string;
    createdAt?: Date;
  };
  token: string;
}

export interface LoginCredentials {
  mobile: string;
  password: string;
}

export interface RegisterData {
  mobile: string;
  name: string;
  password: string;
}

export class AuthService {
  constructor(private db: DB) {}

  async register(data: RegisterData, jwtSecret: string): Promise<AuthResponse> {
    // Check if user already exists
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.mobile, data.mobile))
      .get();

    if (existing) {
      throw new Error("Mobile already registered.");
    }

    // Hash password and create user
    const passwordHash = await hashPassword(data.password, 10);
    const result = await this.db
      .insert(users)
      .values({
        mobile: data.mobile,
        name: data.name,
        password: passwordHash,
        createdAt: new Date(),
      })
      .returning()
      .get();

    if (!result) {
      throw new Error("Failed to create user");
    }

    // Generate JWT token
    const token = await JwtService.sign(
      { sub: result.id, role: result.role, mobile: result.mobile },
      jwtSecret
    );

    return {
      user: {
        id: result.id,
        mobile: result.mobile,
        name: result.name,
        role: result.role,
      },
      token,
    };
  }

  async login(
    credentials: LoginCredentials,
    jwtSecret: string
  ): Promise<AuthResponse> {
    // Find user by mobile
    const user = await this.db
      .select({
        id: users.id,
        mobile: users.mobile,
        name: users.name,
        role: users.role,
        password: users.password,
      })
      .from(users)
      .where(eq(users.mobile, credentials.mobile))
      .get();

    if (!user) {
      throw new Error("Invalid credentials.");
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      credentials.password,
      user.password ?? ""
    );
    if (!isPasswordValid) {
      throw new Error("Invalid credentials.");
    }

    // Generate JWT token
    const token = await JwtService.sign(
      {
        sub: user.id,
        role: user.role as "user" | "customer",
        mobile: user.mobile,
      },
      jwtSecret
    );

    return {
      user: {
        id: user.id,
        mobile: user.mobile,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }

  async getCurrentUser(
    userId: string
  ): Promise<Omit<AuthResponse, "token">["user"]> {
    const user = await this.db
      .select({
        id: users.id,
        mobile: users.mobile,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      mobile: user.mobile,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
