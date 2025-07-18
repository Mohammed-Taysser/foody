import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';

import ennValidation from '@/apps/config';

class TokenService {
  private readonly SECRET = ennValidation.JWT_SECRET;
  private readonly ACCESS_EXPIRY = ennValidation.JWT_ACCESS_EXPIRES_IN;
  private readonly REFRESH_EXPIRY = ennValidation.JWT_REFRESH_EXPIRES_IN;

  private preparePayload(payload: UserTokenPayload): UserTokenPayload {
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  signAccessToken(payload: UserTokenPayload): string {
    return jwt.sign(this.preparePayload(payload), this.SECRET, {
      expiresIn: this.ACCESS_EXPIRY,
    });
  }

  signRefreshToken(payload: UserTokenPayload): string {
    return jwt.sign(this.preparePayload(payload), this.SECRET, {
      expiresIn: this.REFRESH_EXPIRY,
    });
  }

  verifyToken<T extends JwtPayload = JwtPayload>(token: string): T {
    return jwt.verify(token, this.SECRET) as T;
  }

  signResetPasswordToken(payload: UserTokenPayload): string {
    return jwt.sign(this.preparePayload(payload), this.SECRET, {
      expiresIn: ennValidation.JWT_RESET_PASSWORD_EXPIRES_IN,
    });
  }

  signEmailVerificationToken(payload: UserTokenPayload): string {
    return jwt.sign(this.preparePayload(payload), this.SECRET, {
      expiresIn: ennValidation.JWT_EMAIL_VERIFICATION_EXPIRES_IN,
    });
  }
}

const tokenService = new TokenService();

export default tokenService;
