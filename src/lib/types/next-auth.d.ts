import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      discord_id: string;
      name?: string | null;
      image?: string | null;
      user_role: 'member' | 'moderator' | 'admin';
      is_yuumi_member: boolean;
      roles: string[];
    };
  }

  interface User {
    id: string;
    discord_id: string;
    user_role: 'member' | 'moderator' | 'admin';
    is_yuumi_member: boolean;
    roles: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    discord_id?: string;
    access_token?: string;
    user_role?: 'member' | 'moderator' | 'admin';
    is_yuumi_member?: boolean;
  }
}