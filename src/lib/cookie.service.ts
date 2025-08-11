export class CookieService {
  private static readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

  static setAuthCookie(c: any, token: string): void {
    c.header(
      "Set-Cookie",
      `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${this.COOKIE_MAX_AGE}`
    );
  }
}
