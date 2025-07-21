'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { YuumiIcon } from '@/components/ui/datadragon-image';
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
  const pathname = usePathname();

  // Removed duplicate authentication check - middleware handles redirects

  if (isLoading) {
    return (
      <div className="min-h-screen w-full">
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <Sidebar variant="inset" className="backdrop-blur-md bg-black/20 border-purple-500/20 [&_*]:!text-inherit">
              <SidebarHeader className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center justify-center h-8 w-8 bg-yuumi-purple/20 rounded-lg shadow-lg overflow-hidden">
                    <YuumiIcon size="sm" className="rounded-sm border border-yuumi-purple/30" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-sidebar-foreground">Yuum.Ai</span>
                    <span className="text-xs text-muted-foreground">Challenge Tracker</span>
                  </div>
                </div>
                <Separator className="mt-2 bg-sidebar-border" />
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
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-purple-500/20 backdrop-blur-md bg-black/20 px-4">
              <SidebarTrigger className="-ml-1 text-landing-text-primary hover:bg-purple-500/10" />
              <Separator orientation="vertical" className="mr-2 h-4 bg-purple-500/20" />
              <div className="flex items-center justify-between flex-1">
                <div className="w-24 h-6 bg-purple-500/20 rounded animate-pulse"></div>
                <div className="flex items-center space-x-2 text-sm text-landing-text-secondary">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
              <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yuumi-purple"></div>
                <p className="text-sm text-landing-text-secondary">Loading dashboard...</p>
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
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'border-cyan-500 !text-cyan-400 bg-transparent [&>*]:!text-cyan-400';
      case 'admin':
        return 'border-red-500 !text-red-400 bg-transparent [&>*]:!text-red-400';
      default:
        return 'border-yellow-500 !text-yellow-400 bg-transparent [&>*]:!text-yellow-400';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      default:
        return 'Member';
    }
  };

  return (
    <div className="min-h-screen w-full">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
        <Sidebar variant="inset" className="backdrop-blur-md bg-black/20 border-purple-500/20 [&_*]:!text-inherit">
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center h-8 w-8 bg-yuumi-purple/20 rounded-lg shadow-lg overflow-hidden">
                <YuumiIcon size="sm" className="rounded-sm border border-yuumi-purple/30" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-sidebar-foreground">Yuum.Ai</span>
                <span className="text-xs text-muted-foreground">Challenge Tracker</span>
              </div>
            </div>
            <Separator className="mt-2 bg-sidebar-border" />
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
                        className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-white hover:bg-sidebar-accent/50"
                      >
                        <a href={item.url} className="flex items-center space-x-2 text-sidebar-foreground hover:text-sidebar-foreground/80">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
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
                <Separator className="mx-2 bg-sidebar-accent" />
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {adminNavigation.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild
                            tooltip={item.title}
                            isActive={pathname === item.url}
                            className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-white hover:bg-sidebar-accent/50"
                          >
                            <a href={item.url} className="flex items-center space-x-2 text-sidebar-foreground hover:text-sidebar-foreground/80">
                              <item.icon className="h-4 w-4 text-muted-foreground" />
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
                <p className="text-sm font-medium truncate text-sidebar-foreground">{user.name}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Badge
                    variant={isYuumiMember ? 'default' : 'destructive'}
                    className="text-xs px-1 py-0"
                  >
                    {isYuumiMember ? '✅' : '❌'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs px-1 py-0 flex items-center space-x-1 border ${getRoleColor(user.user_role)}`}
                  >
                    {getRoleIcon(user.user_role)}
                    <span>{getRoleDisplayName(user.user_role)}</span>
                  </Badge>
                </div>
              </div>
            </div>
            <Separator className="mb-3 bg-sidebar-accent" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full justify-start text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-purple-500/20 backdrop-blur-md bg-black/20 px-4">
            <SidebarTrigger className="-ml-1 text-landing-text-primary hover:bg-purple-500/10" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-purple-500/20" />
            <div className="flex items-center justify-between flex-1">
              <span className="text-lg font-semibold text-landing-text-primary">Dashboard</span>
              <div className="flex items-center space-x-2 text-sm text-landing-text-secondary">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {!isYuumiMember && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-destructive mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Limited Access
                    </p>
                    <p className="text-sm text-destructive/80 mt-1">
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