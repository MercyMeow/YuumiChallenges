"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function Unauthorized() {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-yuumi-darker flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-yuumi-dark rounded-lg shadow-yuumi p-8 animate-slide-in-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 text-yuumi-warning">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V3m0 0v2m0-2h2m-2 0H9" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-yuumi-warning">Access Denied</h2>
            <p className="text-yuumi-light mb-6">You don't have permission to access this page.</p>
          </div>
          
          <button
            onClick={handleGoBack}
            className="w-full py-3 px-4 bg-yuumi-primary text-white rounded-md hover:bg-yuumi-primary/80 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yuumi-primary focus:ring-offset-2 focus:ring-offset-yuumi-dark"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
