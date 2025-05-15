import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret',
      // For Supabase JWT validation, you would use the public key:
      // secretOrKeyProvider: (request, rawJwtToken, done) => {
      //   const key = configService.get<string>('SUPABASE_JWT_PUBLIC_KEY');
      //   done(null, key);
      // },
      // algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    // The payload will include:
    // - sub: User ID
    // - email: User email
    // - iat: Issued at timestamp
    // - exp: Expiration timestamp
    // - org_id: Organization ID (optional)
    // - role: User role (optional)
    
    return {
      sub: payload.sub,
      email: payload.email,
      organizationId: payload.org_id,
      role: payload.role,
    };
  }
}