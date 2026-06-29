import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Strategy } = require('passport-kakao');

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('KAKAO_CLIENT_ID', ''),
      clientSecret: config.get<string>('KAKAO_CLIENT_SECRET', ''),
      callbackURL: config.get<string>('KAKAO_CALLBACK_URL', ''),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate(_accessToken: string, _refreshToken: string, profile: any, done: (err: any, user: any) => void) {
    const { id, username, _json } = profile;
    done(null, {
      providerId: String(id),
      email: _json?.kakao_account?.email ?? `kakao_${id}@noemail.com`,
      nickname: username || `카카오유저${id}`,
      provider: 'kakao',
    });
  }
}
