"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('discord', { callbackUrl: '/' });
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-yuumi-darker flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 animate-float">
            <svg viewBox='0 0 100 100' fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="50" cy="50" r="45" fill="var(--yuumi-accent)" />
              <path d="M35 65C35 57.268 41.268 51 49 51H51C58.732 51 65 57.268 65 65V65C65 72.732 58.732 79 51 79H49C41.268 79 35 72.732 35 65V65Z" fill="var(--yuumi-darker)" />
              <circle cx="35" cy="40" r="8" fill="var(--yuumi-darker)" />
              <circle cx="65" cy="40" r="8" fill="var(--yuumi-darker)" />
              <path d="M45 30C45 27.2386 47.2386 25 50 25V25C52.7614 25 55 27.2386 55 30V35C55 37.7614 52.7614 40 50 40V40C47.2386 40 45 37.7614 45 35V30Z" fill="var(--yuumi-darker)" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-2 yuumi-gradient-text">Yuum.Ai Dashboard</h1>
          <p className="text-yuumi-light text-lg mb-8">Sign in to track your League of Legends challenges</p>
        </div>

        <div className="bg-yuumi-dark rounded-lg shadow-yuumi p-8 animate-slide-in-up">
          <h2 className="text-2xl font-semibold mb-6 text-center text-yuumi-light">Sign In</h2>
          
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 bg-[#5865F2] hover:bg-[#4752C4] text-white py-3 px-4 rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2 focus:ring-offset-yuumi-dark"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36">
                  <path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
                <span>Sign in with Discord</span>
              </>
            )}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-yuumi-light text-sm">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
