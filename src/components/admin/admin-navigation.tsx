'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Target, 
  Settings, 
  FileText, 
  Flag 
} from 'lucide-react';

type AdminSection = 'dashboard' | 'users' | 'challenges' | 'reports' | 'audit' | 'settings';

interface AdminPermissions {
  viewUsers: boolean;
  viewChallenges: boolean;
  viewReports: boolean;
  moderateContent: boolean;
  createChallenges: boolean;
  editChallenges: boolean;
  deleteChallenges: boolean;
  manageUsers: boolean;
  viewSystemStats: boolean;
  manageRoles: boolean;
  systemSettings: boolean;
}

interface AdminNavigationProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  permissions: AdminPermissions;
}

export function AdminNavigation({ 
  activeSection, 
  onSectionChange, 
  permissions 
}: AdminNavigationProps) {
  const adminSections = [
    { 
      id: 'dashboard' as AdminSection, 
      label: 'Dashboard', 
      icon: BarChart3, 
      permission: permissions.viewSystemStats,
      badge: null,
      description: 'Overview and statistics'
    },
    { 
      id: 'users' as AdminSection, 
      label: 'User Management', 
      icon: Users, 
      permission: permissions.viewUsers,
      badge: null,
      description: 'Manage user accounts and roles'
    },
    { 
      id: 'challenges' as AdminSection, 
      label: 'Challenges', 
      icon: Target, 
      permission: permissions.viewChallenges,
      badge: null,
      description: 'Create and manage challenges'
    },
    { 
      id: 'settings' as AdminSection, 
      label: 'Settings', 
      icon: Settings, 
      permission: permissions.systemSettings,
      badge: null,
      description: 'System configuration'
    },
  ];

  const visibleSections = adminSections.filter(section => section.permission);

  return (
    <Card className="bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5 border-purple-500/20 backdrop-blur-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Admin Controls</h2>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-400">
              {visibleSections.length} section{visibleSections.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <Button
                key={section.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => onSectionChange(section.id)}
                className={`
                  flex flex-col items-center space-y-2 h-auto py-4 px-3
                  ${isActive 
                    ? 'bg-purple-500/20 border-purple-500/30 text-white shadow-lg shadow-purple-500/20' 
                    : 'bg-slate-800/30 border-slate-700/50 text-gray-300 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-white'
                  }
                  backdrop-blur-sm transition-all duration-200
                `}
              >
                <div className="relative">
                  <Icon className={`h-6 w-6 ${isActive ? 'text-purple-300' : 'text-gray-400'}`} />
                  {section.badge && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                      {section.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{section.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{section.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {visibleSections.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No admin sections available with your current permissions.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}