'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminNavigation } from '@/components/admin/admin-navigation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { UserManagement } from '@/components/admin/user-management';
import { ChallengeManagement } from '@/components/admin/challenge-management';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

type AdminSection = 'dashboard' | 'users' | 'challenges' | 'reports' | 'audit' | 'settings';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading, isModerator, isAdmin } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
        return;
      }
      
      if (!isModerator && !isAdmin) {
        router.push('/dashboard');
        return;
      }
      
      setIsInitializing(false);
    }
  }, [isAuthenticated, isLoading, isModerator, isAdmin, router]);

  if (isLoading || isInitializing) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <p className="text-sm text-purple-300">Loading admin panel...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!isModerator && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Alert className="border-red-500/20 bg-red-500/5 max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don&apos;t have permission to access the admin panel. 
              Contact a system administrator if you believe this is an error.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const permissions = {
    viewUsers: isModerator,
    viewChallenges: isModerator,
    viewReports: isModerator,
    moderateContent: isModerator,
    createChallenges: isAdmin,
    editChallenges: isAdmin,
    deleteChallenges: isAdmin,
    manageUsers: isAdmin,
    viewSystemStats: isModerator,
    manageRoles: isAdmin,
    systemSettings: isAdmin,
    viewAuditLog: isModerator,
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'challenges':
        return <ChallengeManagement />;
      case 'settings':
        return (
          <Card className="bg-gradient-to-br from-slate-500/5 to-slate-600/5 border-slate-500/20">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
                <p className="text-gray-400">
                  System settings panel coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminHeader user={user} />
        
        <AdminNavigation 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          permissions={permissions}
        />
        
        <div className="min-h-[600px]">
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}