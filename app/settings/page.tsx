"use client";

import React, { useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth({ required: true });
  const [activeTab, setActiveTab] = useState('account');
  
  // Placeholder for settings form state
  const [settings, setSettings] = useState({
    displayName: user?.name || '',
    email: user?.email || '',
    notifications: {
      email: true,
      discord: true,
    },
    theme: 'dark',
    language: 'en',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [name.split('.')[1]]: checked,
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would save the settings to the database
    console.log('Saving settings:', settings);
    // Show success message
    alert('Settings saved successfully!');
  };
  
  return (
    <MainLayout title="Settings - Yuum.Ai Dashboard">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold yuumi-gradient-text">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="p-0">
              <nav className="divide-y divide-yuumi-primary/20">
                <button
                  className={`w-full text-left px-4 py-3 transition-colors duration-200 ${activeTab === 'account' ? 'bg-yuumi-primary/20 text-yuumi-primary' : 'hover:bg-yuumi-primary/10'}`}
                  onClick={() => setActiveTab('account')}
                >
                  Account
                </button>
                <button
                  className={`w-full text-left px-4 py-3 transition-colors duration-200 ${activeTab === 'notifications' ? 'bg-yuumi-primary/20 text-yuumi-primary' : 'hover:bg-yuumi-primary/10'}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  Notifications
                </button>
                <button
                  className={`w-full text-left px-4 py-3 transition-colors duration-200 ${activeTab === 'appearance' ? 'bg-yuumi-primary/20 text-yuumi-primary' : 'hover:bg-yuumi-primary/10'}`}
                  onClick={() => setActiveTab('appearance')}
                >
                  Appearance
                </button>
                <button
                  className={`w-full text-left px-4 py-3 transition-colors duration-200 ${activeTab === 'connections' ? 'bg-yuumi-primary/20 text-yuumi-primary' : 'hover:bg-yuumi-primary/10'}`}
                  onClick={() => setActiveTab('connections')}
                >
                  Connections
                </button>
              </nav>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-3">
            <Card>
              <form onSubmit={handleSubmit}>
                {/* Account Settings */}
                {activeTab === 'account' && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-semibold yuumi-gradient-text">Account Settings</h2>
                    
                    <div>
                      <label className="block text-yuumi-light mb-1">Display Name</label>
                      <input
                        type="text"
                        name="displayName"
                        value={settings.displayName}
                        onChange={handleChange}
                        className="w-full bg-yuumi-darker border border-yuumi-primary/30 rounded-md px-4 py-2 text-yuumi-light focus:outline-none focus:ring-2 focus:ring-yuumi-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-yuumi-light mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={settings.email}
                        onChange={handleChange}
                        className="w-full bg-yuumi-darker border border-yuumi-primary/30 rounded-md px-4 py-2 text-yuumi-light focus:outline-none focus:ring-2 focus:ring-yuumi-primary"
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-yuumi-primary/20">
                      <Button type="submit" variant="primary">
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-semibold yuumi-gradient-text">Notification Settings</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notifications.email"
                          name="notifications.email"
                          checked={settings.notifications.email}
                          onChange={handleChange}
                          className="h-4 w-4 text-yuumi-primary focus:ring-yuumi-primary border-yuumi-primary/30 rounded"
                        />
                        <label htmlFor="notifications.email" className="ml-2 text-yuumi-light">
                          Email Notifications
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notifications.discord"
                          name="notifications.discord"
                          checked={settings.notifications.discord}
                          onChange={handleChange}
                          className="h-4 w-4 text-yuumi-primary focus:ring-yuumi-primary border-yuumi-primary/30 rounded"
                        />
                        <label htmlFor="notifications.discord" className="ml-2 text-yuumi-light">
                          Discord Notifications
                        </label>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-yuumi-primary/20">
                      <Button type="submit" variant="primary">
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Appearance Settings */}
                {activeTab === 'appearance' && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-semibold yuumi-gradient-text">Appearance Settings</h2>
                    
                    <div>
                      <label className="block text-yuumi-light mb-1">Theme</label>
                      <select
                        name="theme"
                        value={settings.theme}
                        onChange={handleChange}
                        className="w-full bg-yuumi-darker border border-yuumi-primary/30 rounded-md px-4 py-2 text-yuumi-light focus:outline-none focus:ring-2 focus:ring-yuumi-primary"
                      >
                        <option value="dark">Dark (Default)</option>
                        <option value="light">Light</option>
                        <option value="system">System Preference</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-yuumi-light mb-1">Language</label>
                      <select
                        name="language"
                        value={settings.language}
                        onChange={handleChange}
                        className="w-full bg-yuumi-darker border border-yuumi-primary/30 rounded-md px-4 py-2 text-yuumi-light focus:outline-none focus:ring-2 focus:ring-yuumi-primary"
                      >
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="es">Spanish</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                      </select>
                    </div>
                    
                    <div className="pt-4 border-t border-yuumi-primary/20">
                      <Button type="submit" variant="primary">
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Connections Settings */}
                {activeTab === 'connections' && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-semibold yuumi-gradient-text">Connected Accounts</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/20">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[#5865F2]/20 rounded-full flex items-center justify-center mr-3">
                            <span className="text-[#5865F2] font-bold">D</span>
                          </div>
                          <div>
                            <p className="font-medium text-yuumi-light">Discord</p>
                            <p className="text-sm text-yuumi-light/70">{user?.name || 'Connected'}</p>
                          </div>
                        </div>
                        <span className="text-yuumi-success text-sm">Connected</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/20">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-yuumi-error/20 rounded-full flex items-center justify-center mr-3">
                            <span className="text-yuumi-error font-bold">R</span>
                          </div>
                          <div>
                            <p className="font-medium text-yuumi-light">Riot Games</p>
                            <p className="text-sm text-yuumi-light/70">Not connected</p>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm">
                          Connect
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/20">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[#6441a5]/20 rounded-full flex items-center justify-center mr-3">
                            <span className="text-[#6441a5] font-bold">T</span>
                          </div>
                          <div>
                            <p className="font-medium text-yuumi-light">Twitch</p>
                            <p className="text-sm text-yuumi-light/70">Not connected</p>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm">
                          Connect
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
