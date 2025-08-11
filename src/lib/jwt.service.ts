import { SignJWT, jwtVerify, JWTPayload } from "jose";

export interface JwtPayload extends JWTPayload {
  sub: string;
  role: string;
  mobile: string;
}

export class JwtService {
  private static readonly JWT_EXPIRY_DAYS = 30;

  static async sign(
    payload: JwtPayload,
    secret: string,
    days: number = this.JWT_EXPIRY_DAYS
  ): Promise<string> {
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${days}d`)
      .sign(new TextEncoder().encode(secret));
    return jwt;
  }

  static async verify(
    token: string,
    secret: string
  ): Promise<JwtPayload | null> {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );
      return payload as JwtPayload;
    } catch {
      return null;
    }
  }
}
