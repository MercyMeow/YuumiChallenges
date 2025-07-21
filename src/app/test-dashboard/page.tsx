'use client';

import { useAuth } from '@/lib/hooks/use-auth';

export default function TestDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div>Loading auth...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div>Not authenticated</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">🎯 Test Dashboard</h1>
        <p className="text-green-400 mb-4">✅ Successfully authenticated!</p>
        
        <div className="bg-gray-800 p-4 rounded-lg space-y-2">
          <div><strong>Name:</strong> {user?.name}</div>
          <div><strong>Discord ID:</strong> {user?.discord_id}</div>
          <div><strong>Role:</strong> {user?.user_role}</div>
          <div><strong>Yuumi Member:</strong> {user?.is_yuumi_member ? 'Yes' : 'No'}</div>
        </div>

        <div className="mt-8 space-y-4">
          <a 
            href="/dashboard" 
            className="block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-center"
          >
            Try Real Dashboard →
          </a>
          <a 
            href="/debug/auth" 
            className="block bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-center"
          >
            Debug Auth →
          </a>
        </div>
      </div>
    </div>
  );
}