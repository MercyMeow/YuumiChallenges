"use client";

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';

interface DatabaseStatus {
  success: boolean;
  message: string;
  status: 'connected' | 'disconnected' | 'error';
  collections?: {
    users: number;
    challenges: number;
    matches: number;
  };
  error?: string;
}

export default function DatabaseAdminPage() {
  const { user, hasRole } = useAuth({ required: true, role: 'admin' });
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initLoading, setInitLoading] = useState<boolean>(false);
  const [initResult, setInitResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch database status
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/db/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        success: false,
        message: 'Failed to fetch database status',
        status: 'error',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize database
  const initializeDatabase = async () => {
    setInitLoading(true);
    setInitResult(null);
    try {
      const response = await fetch('/api/db/init');
      const data = await response.json();
      setInitResult(data);
      // Refresh status after initialization
      fetchStatus();
    } catch (error) {
      setInitResult({
        success: false,
        message: `Failed to initialize database: ${error.message}`
      });
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <MainLayout title="Database Admin - Yuum.Ai Dashboard">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold yuumi-gradient-text">Database Administration</h1>
          <Button 
            onClick={fetchStatus} 
            variant="secondary" 
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </Button>
        </div>

        {/* Database Status */}
        <Card>
          <h2 className="text-xl font-semibold yuumi-gradient-text mb-4">Database Status</h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yuumi-primary"></div>
            </div>
          ) : status ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${
                  status.status === 'connected' ? 'bg-yuumi-success' : 
                  status.status === 'disconnected' ? 'bg-yuumi-error' : 'bg-yuumi-warning'
                }`}></div>
                <span className="font-medium">
                  Status: {status.status === 'connected' ? 'Connected' : 
                          status.status === 'disconnected' ? 'Disconnected' : 'Error'}
                </span>
              </div>
              
              <p className="text-yuumi-light">{status.message}</p>
              
              {status.error && (
                <div className="p-3 bg-yuumi-error/10 border border-yuumi-error/30 rounded-md text-yuumi-error">
                  {status.error}
                </div>
              )}
              
              {status.collections && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-yuumi-darker p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-1">Users</h3>
                    <p className="text-2xl font-bold yuumi-gradient-text">{status.collections.users}</p>
                  </div>
                  <div className="bg-yuumi-darker p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-1">Challenges</h3>
                    <p className="text-2xl font-bold yuumi-gradient-text">{status.collections.challenges}</p>
                  </div>
                  <div className="bg-yuumi-darker p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-1">Matches</h3>
                    <p className="text-2xl font-bold yuumi-gradient-text">{status.collections.matches}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-yuumi-light">Failed to load database status.</p>
          )}
        </Card>

        {/* Database Actions */}
        <Card>
          <h2 className="text-xl font-semibold yuumi-gradient-text mb-4">Database Actions</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-yuumi-darker rounded-lg">
              <h3 className="text-lg font-medium mb-2">Initialize Database</h3>
              <p className="text-yuumi-light mb-4">
                This will create all necessary collections and indexes if they don't exist.
                It's safe to run this multiple times.
              </p>
              
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={initializeDatabase} 
                  variant="primary" 
                  disabled={initLoading}
                >
                  {initLoading ? 'Initializing...' : 'Initialize Database'}
                </Button>
                
                {initResult && (
                  <div className={`p-2 rounded ${
                    initResult.success ? 'bg-yuumi-success/10 text-yuumi-success' : 'bg-yuumi-error/10 text-yuumi-error'
                  }`}>
                    {initResult.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Connection Information */}
        <Card>
          <h2 className="text-xl font-semibold yuumi-gradient-text mb-4">Connection Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Environment</h3>
                <p className="text-yuumi-light">
                  {process.env.NODE_ENV === 'development' ? 'Development' : 'Production'}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Database Name</h3>
                <p className="text-yuumi-light">
                  {process.env.MONGODB_DB || 'yuumai'}
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-yuumi-warning/10 border border-yuumi-warning/30 rounded-md text-yuumi-warning">
              <p className="font-medium">Security Notice</p>
              <p className="text-sm">
                For security reasons, we don't display the full connection string. 
                Check your environment variables for the complete configuration.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
