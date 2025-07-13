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
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <Sidebar variant="inset">
            <SidebarHeader className="p-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center h-8 w-8 bg-primary rounded-lg">
                  <span className="text-primary-foreground font-bold text-sm">🐱</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Yuum.Ai</span>
                  <span className="text-xs text-muted-foreground">Challenge Tracker</span>
                </div>
              </div>
              <Separator className="mt-2" />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {[1, 2, 3, 4].map((i) => (
                      <SidebarMenuItem key={i}>
                        <div className="flex items-center space-x-2 p-2">
                          <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
                          <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
                        </div>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="w-24 h-4 bg-muted rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center justify-between flex-1">
                <div className="w-24 h-6 bg-muted rounded animate-pulse"></div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
              <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading dashboard...</p>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar variant="inset">
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center h-8 w-8 bg-primary rounded-lg">
                <span className="text-primary-foreground font-bold text-sm">🐱</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Yuum.Ai</span>
                <span className="text-xs text-muted-foreground">Challenge Tracker</span>
              </div>
            </div>
            <Separator className="mt-2" />
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
                      >
                        <a href={item.url} className="flex items-center space-x-2">
                          <item.icon className="h-4 w-4" />
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
                <Separator className="mx-2" />
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminNavigation.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild
                            tooltip={item.title}
                            isActive={pathname === item.url}
                          >
                            <a href={item.url} className="flex items-center space-x-2">
                              <item.icon className="h-4 w-4" />
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
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
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
            <Separator className="mb-3" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center justify-between flex-1">
              <span className="text-lg font-semibold">Dashboard</span>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {!isYuumiMember && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Limited Access
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
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
  );
}