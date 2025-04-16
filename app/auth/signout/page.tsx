"use client";

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignOut() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-yuumi-darker flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-yuumi-dark rounded-lg shadow-yuumi p-8 animate-slide-in-up">
          <h2 className="text-2xl font-semibold mb-6 text-center text-yuumi-light">Sign Out</h2>
          <p className="text-yuumi-light mb-8 text-center">Are you sure you want to sign out?</p>
          
          <div className="flex space-x-4">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-yuumi-dark border border-yuumi-primary text-yuumi-light rounded-md hover:bg-yuumi-primary/10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yuumi-primary focus:ring-offset-2 focus:ring-offset-yuumi-dark"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-yuumi-error text-white rounded-md hover:bg-yuumi-error/80 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yuumi-error focus:ring-offset-2 focus:ring-offset-yuumi-dark"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Sign Out'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
