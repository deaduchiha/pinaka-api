import { JwtService } from "../lib/jwt.service";

export async function verifyJwt(c: any): Promise<any> {
  // Try Authorization header first
  let token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    // Fallback to cookie
    try {
      token = c.req.cookie("token");
    } catch {
      // Cookie parsing might fail, continue without it
    }
  }

  if (!token) {
    return null;
  }

  return JwtService.verify(token, c.env.JWT_SECRET);
}
