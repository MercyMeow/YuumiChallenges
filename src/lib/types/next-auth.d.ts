import 'next-auth';
import { UserRole } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      discord_id: string;
      name?: string | null;
      image?: string | null;
      user_role: UserRole;
      is_yuumi_member: boolean;
    };
  }

  interface User {
    id: string;
    discord_id: string;
    user_role: UserRole;
    is_yuumi_member: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    discord_id?: string;
    access_token?: string;
    user_role?: UserRole;
    is_yuumi_member?: boolean;
  }
}