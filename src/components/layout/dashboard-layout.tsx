'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Home,
  Target,
  BarChart3,
  Trophy,
  Settings,
  LogOut,
  User,
  Shield,
  Crown,
  Image,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'My Challenges',
    url: '/dashboard/challenges',
    icon: Target,
  },
  {
    title: 'League Profile',
    url: '/dashboard/profile',
    icon: BarChart3,
  },
  {
    title: 'Leaderboard',
    url: '/dashboard/leaderboard',
    icon: Trophy,
  },
  {
    title: 'Gallery',
    url: '/gallery',
    icon: Image,
  },
];

const adminNavigation = [
  {
    title: 'Admin Panel',
    url: '/admin',
    icon: Settings,
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading, isYuumiMember } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Magical Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(147,51,234,0.3)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,69,234,0.2)_0%,_transparent_50%)]"></div>
        </div>

        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute animate-pulse top-1/4 left-1/4 w-2 h-2 bg-purple-400/60 rounded-full shadow-lg shadow-purple-400/30"></div>
          <div className="absolute animate-pulse delay-1000 top-3/4 left-3/4 w-1 h-1 bg-blue-400/60 rounded-full shadow-lg shadow-blue-400/30"></div>
          <div className="absolute animate-pulse delay-2000 top-1/2 left-1/6 w-1.5 h-1.5 bg-indigo-400/60 rounded-full shadow-lg shadow-indigo-400/30"></div>
          <div className="absolute animate-pulse delay-500 top-1/6 left-2/3 w-1 h-1 bg-purple-300/60 rounded-full shadow-lg shadow-purple-300/30"></div>
          <div className="absolute animate-pulse delay-1500 bottom-1/4 right-1/4 w-2 h-2 bg-blue-300/60 rounded-full shadow-lg shadow-blue-300/30"></div>
          <div className="absolute animate-float delay-700 top-1/3 left-1/2 w-1.5 h-1.5 bg-violet-400/50 rounded-full shadow-lg shadow-violet-400/30"></div>
          <div className="absolute animate-float delay-300 top-2/3 left-1/5 w-1 h-1 bg-cyan-400/50 rounded-full shadow-lg shadow-cyan-400/30"></div>
          <div className="absolute animate-float delay-1200 top-1/5 left-4/5 w-2 h-2 bg-fuchsia-400/40 rounded-full shadow-lg shadow-fuchsia-400/30"></div>
        </div>

        <SidebarProvider>
          <div className="relative z-10 min-h-screen flex w-full">
            <Sidebar variant="inset" className="backdrop-blur-md bg-black/20 border-purple-500/20 [&_*]:!text-inherit">
              <SidebarHeader className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center justify-center h-8 w-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg">
                    <span className="text-white font-bold text-sm">🐱</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-white">Yuum.Ai</span>
                    <span className="text-xs text-purple-300">Challenge Tracker</span>
                  </div>
                </div>
                <Separator className="mt-2 bg-purple-500/30" />
              </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {[1, 2, 3, 4].map((i) => (
                      <SidebarMenuItem key={i}>
                        <div className="flex items-center space-x-2 p-2">
                          <div className="w-4 h-4 bg-purple-500/30 rounded animate-pulse"></div>
                          <div className="w-20 h-4 bg-purple-500/30 rounded animate-pulse"></div>
                        </div>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-8 w-8 bg-purple-500/30 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="w-24 h-4 bg-purple-500/30 rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-purple-500/30 rounded animate-pulse"></div>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-purple-500/20 bg-black/20 backdrop-blur-md px-4">
              <SidebarTrigger className="-ml-1 text-white hover:bg-purple-500/20" />
              <Separator orientation="vertical" className="mr-2 h-4 bg-purple-500/30" />
              <div className="flex items-center justify-between flex-1">
                <div className="w-24 h-6 bg-purple-500/30 rounded animate-pulse"></div>
                <div className="flex items-center space-x-2 text-sm text-purple-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
              <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                <p className="text-sm text-purple-300">Loading dashboard...</p>
              </div>
            </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to signin
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'mod':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-500 text-yellow-900';
      case 'mod':
        return 'bg-blue-500 text-blue-900';
      default:
        return 'bg-gray-500 text-gray-900';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Magical Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-landing-bg-from via-landing-bg-via to-landing-bg-to">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(147,51,234,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.3)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,69,234,0.2)_0%,_transparent_50%)]"></div>
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute animate-pulse top-1/4 left-1/4 w-2 h-2 bg-purple-400/60 rounded-full shadow-lg shadow-purple-400/30"></div>
        <div className="absolute animate-pulse delay-1000 top-3/4 left-3/4 w-1 h-1 bg-blue-400/60 rounded-full shadow-lg shadow-blue-400/30"></div>
        <div className="absolute animate-pulse delay-2000 top-1/2 left-1/6 w-1.5 h-1.5 bg-indigo-400/60 rounded-full shadow-lg shadow-indigo-400/30"></div>
        <div className="absolute animate-pulse delay-500 top-1/6 left-2/3 w-1 h-1 bg-purple-300/60 rounded-full shadow-lg shadow-purple-300/30"></div>
        <div className="absolute animate-pulse delay-1500 bottom-1/4 right-1/4 w-2 h-2 bg-blue-300/60 rounded-full shadow-lg shadow-blue-300/30"></div>
        <div className="absolute animate-float delay-700 top-1/3 left-1/2 w-1.5 h-1.5 bg-violet-400/50 rounded-full shadow-lg shadow-violet-400/30"></div>
        <div className="absolute animate-float delay-300 top-2/3 left-1/5 w-1 h-1 bg-cyan-400/50 rounded-full shadow-lg shadow-cyan-400/30"></div>
        <div className="absolute animate-float delay-1200 top-1/5 left-4/5 w-2 h-2 bg-fuchsia-400/40 rounded-full shadow-lg shadow-fuchsia-400/30"></div>
      </div>

      <SidebarProvider>
        <div className="relative z-10 min-h-screen flex w-full">
        <Sidebar variant="inset" className="backdrop-blur-md bg-black/20 border-purple-500/20 [&_*]:!text-inherit">
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center h-8 w-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg">
                <span className="text-white font-bold text-sm">🐱</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-white">Yuum.Ai</span>
                <span className="text-xs text-purple-300">Challenge Tracker</span>
              </div>
            </div>
            <Separator className="mt-2 bg-purple-500/30" />
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        tooltip={item.title}
                        isActive={pathname === item.url}
                        className="data-[active=true]:bg-purple-500/30 data-[active=true]:text-white hover:bg-purple-500/20"
                      >
                        <a href={item.url} className="flex items-center space-x-2 text-white hover:text-purple-200">
                          <item.icon className="h-4 w-4 text-purple-300" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {user.user_role !== 'member' && (
              <>
                <Separator className="mx-2 bg-purple-500/30" />
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminNavigation.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild
                            tooltip={item.title}
                            isActive={pathname === item.url}
                            className="data-[active=true]:bg-purple-500/30 data-[active=true]:text-white hover:bg-purple-500/20"
                          >
                            <a href={item.url} className="flex items-center space-x-2 text-white hover:text-purple-200">
                              <item.icon className="h-4 w-4 text-purple-300" />
                              <span>{item.title}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xs">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{user.name}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Badge
                    variant={isYuumiMember ? 'default' : 'destructive'}
                    className="text-xs px-1 py-0"
                  >
                    {isYuumiMember ? '✅' : '❌'}
                  </Badge>
                  <Badge
                    className={`text-xs px-1 py-0 flex items-center space-x-1 ${getRoleColor(user.user_role)}`}
                  >
                    {getRoleIcon(user.user_role)}
                    <span>{user.user_role}</span>
                  </Badge>
                </div>
              </div>
            </div>
            <Separator className="mb-3 bg-purple-500/30" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/20 backdrop-blur-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-purple-500/20 bg-black/20 backdrop-blur-md px-4">
            <SidebarTrigger className="-ml-1 text-white hover:bg-purple-500/20" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-purple-500/30" />
            <div className="flex items-center justify-between flex-1">
              <span className="text-lg font-semibold text-white">Dashboard</span>
              <div className="flex items-center space-x-2 text-sm text-purple-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {!isYuumiMember && (
              <div className="mb-6 p-4 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-red-400 mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-red-200">
                      Limited Access
                    </p>
                    <p className="text-sm text-red-300 mt-1">
                      You&apos;re not detected as a member of the Yuumi Mains Discord server. 
                      Some features may be limited. Please ensure you&apos;ve joined the server and try signing in again.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {children}
          </main>
        </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}