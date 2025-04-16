"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'An unknown error occurred during authentication.';
  
  // Map error codes to user-friendly messages
  switch (error) {
    case 'AccessDenied':
      errorMessage = 'Access denied. You may have denied permission to access your account.';
      break;
    case 'Configuration':
      errorMessage = 'There is a problem with the server configuration.';
      break;
    case 'Verification':
      errorMessage = 'The verification token has expired or has already been used.';
      break;
    case 'OAuthSignin':
      errorMessage = 'Error in the OAuth sign-in process.';
      break;
    case 'OAuthCallback':
      errorMessage = 'Error in the OAuth callback process.';
      break;
    case 'OAuthCreateAccount':
      errorMessage = 'Could not create OAuth account.';
      break;
    case 'EmailCreateAccount':
      errorMessage = 'Could not create email account.';
      break;
    case 'Callback':
      errorMessage = 'Error in the callback handler.';
      break;
    case 'OAuthAccountNotLinked':
      errorMessage = 'This account is already linked to another user.';
      break;
    case 'SessionRequired':
      errorMessage = 'You must be signed in to access this page.';
      break;
    default:
      errorMessage = 'An unknown error occurred during authentication.';
  }

  const handleGoBack = () => {
    router.push('/');
  };

  const handleTryAgain = () => {
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-yuumi-darker flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-yuumi-dark rounded-lg shadow-yuumi p-8 animate-slide-in-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 text-yuumi-error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-yuumi-error">Authentication Error</h2>
            <p className="text-yuumi-light mb-6">{errorMessage}</p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleGoBack}
              className="w-full py-3 px-4 bg-yuumi-dark border border-yuumi-primary text-yuumi-light rounded-md hover:bg-yuumi-primary/10 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yuumi-primary focus:ring-offset-2 focus:ring-offset-yuumi-dark"
            >
              Go Home
            </button>
            
            <button
              onClick={handleTryAgain}
              className="w-full py-3 px-4 bg-yuumi-primary text-white rounded-md hover:bg-yuumi-primary/80 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yuumi-primary focus:ring-offset-2 focus:ring-offset-yuumi-dark"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
