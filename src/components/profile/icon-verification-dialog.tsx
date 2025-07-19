'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { getSummonerIconUrl } from '@/lib/apis/datadragon';

interface IconVerificationData {
  accountData: {
    puuid: string;
    gameName: string;
    tagLine: string;
    summonerId: string;
    currentIconId: number;
    level: number;
  };
  verification: {
    selectedIconId: number;
    iconUrl: string;
    instructions: string;
  };
}

interface IconVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameName: string;
  tagLine: string;
  region: string;
  onSuccess: () => void;
}

export function IconVerificationDialog({
  open,
  onOpenChange,
  gameName,
  tagLine,
  region,
  onSuccess,
}: IconVerificationDialogProps) {
  const [step, setStep] = useState<'loading' | 'display' | 'verifying' | 'success' | 'error'>('loading');
  const [verificationData, setVerificationData] = useState<IconVerificationData | null>(null);
  const [currentIconUrl, setCurrentIconUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  // Start verification process when dialog opens
  useEffect(() => {
    if (open && gameName && tagLine && region) {
      startVerification();
    }
  }, [open, gameName, tagLine, region]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('loading');
      setVerificationData(null);
      setCurrentIconUrl('');
      setError('');
      setChecking(false);
    }
  }, [open]);

  const startVerification = async () => {
    setStep('loading');
    setError('');

    try {
      const response = await fetch('/api/summoners/verify-icon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameName,
          tagLine,
          region,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start verification');
      }

      setVerificationData(data);
      
      // Get current icon URL
      const currentIconUrl = await getSummonerIconUrl(data.accountData.currentIconId);
      setCurrentIconUrl(currentIconUrl);
      
      setStep('display');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start verification');
      setStep('error');
    }
  };

  const handleVerify = async () => {
    if (!verificationData) return;

    setChecking(true);
    setError('');

    try {
      const response = await fetch('/api/summoners/verify-icon', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameName: verificationData.accountData.gameName,
          tagLine: verificationData.accountData.tagLine,
          region,
          expectedIconId: verificationData.verification.selectedIconId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Verification failed');
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      
      // Refresh current icon data when verification fails to show user's actual current icon
      try {
        const refreshResponse = await fetch('/api/summoners/verify-icon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameName: verificationData.accountData.gameName,
            tagLine: verificationData.accountData.tagLine,
            region,
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          // Update current icon data with fresh information
          setVerificationData(prev => prev ? {
            ...prev,
            accountData: {
              ...prev.accountData,
              currentIconId: refreshData.accountData.currentIconId,
            }
          } : null);
          
          // Update current icon URL
          const newCurrentIconUrl = await getSummonerIconUrl(refreshData.accountData.currentIconId);
          setCurrentIconUrl(newCurrentIconUrl);
        }
      } catch (refreshError) {
        console.error('Failed to refresh current icon data:', refreshError);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleRetry = () => {
    startVerification();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/90 backdrop-blur-md border-slate-700/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Verify Account with Icon</DialogTitle>
          <DialogDescription className="text-gray-400">
            Change your summoner icon to verify ownership of {gameName}#{tagLine}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {step === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 animate-spin text-blue-400" />
                <span className="text-gray-400">Loading verification data...</span>
              </div>
            </div>
          )}

          {step === 'error' && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {step === 'success' && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Account verified successfully! You can now participate in challenges.
              </AlertDescription>
            </Alert>
          )}

          {(step === 'display' || step === 'verifying') && verificationData && (
            <>
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h3 className="font-semibold text-blue-400 mb-3">Step 1: Change Your Icon</h3>
                <div className="text-center space-y-4">
                  {/* Icons Display */}
                  <div className="flex items-center justify-center gap-6">
                    {/* Current Icon */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="relative">
                        <Image
                          src={currentIconUrl}
                          alt="Current Icon"
                          width={64}
                          height={64}
                          className="rounded-lg border-2 border-gray-500/50"
                        />
                      </div>
                      <span className="text-xs text-gray-400">Current</span>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex flex-col items-center">
                      <ArrowRight className="h-6 w-6 text-blue-400" />
                      <span className="text-xs text-blue-400 mt-1">Change to</span>
                    </div>
                    
                    {/* Target Icon */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="relative">
                        <Image
                          src={verificationData.verification.iconUrl}
                          alt="Verification Icon"
                          width={64}
                          height={64}
                          className="rounded-lg border-2 border-blue-400/50"
                        />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                      </div>
                      <span className="text-xs text-blue-400">Required</span>
                    </div>
                  </div>
                  
                  {/* Icon IDs */}
                  <div className="flex items-center justify-center text-sm">
                    <div className="w-20 text-center">
                      <span className="text-gray-400">ID: </span>
                      <span className="text-gray-300">{verificationData.accountData.currentIconId}</span>
                    </div>
                    <div className="w-20 flex justify-center">{/* Spacer for arrow alignment */}</div>
                    <div className="w-20 text-center">
                      <span className="text-gray-400">ID: </span>
                      <span className="text-blue-400">{verificationData.verification.selectedIconId}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300">
                    Set the required icon as your summoner icon in League of Legends
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h3 className="font-semibold text-purple-400 mb-2">Step 2: Instructions</h3>
                <ol className="text-sm space-y-1 text-gray-400">
                  <li>1. Open League of Legends client</li>
                  <li>2. Click on your profile</li>
                  <li>3. Click &quot;Change Icon&quot;</li>
                  <li>4. Select the icon shown above</li>
                  <li>5. Click &quot;Verify Account&quot; below</li>
                </ol>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Summoner Level:</span>
                  <span className="text-gray-300">{verificationData.accountData.level}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Summoner Name:</span>
                  <span className="text-gray-300">{verificationData.accountData.gameName}#{verificationData.accountData.tagLine}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 py-2">
                <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-400">
                  {checking ? 'Checking for icon change...' : 'Ready to verify'}
                </span>
              </div>

              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={checking}
            className="bg-slate-800/50 border-slate-600/50 text-gray-300 hover:bg-slate-700/50"
          >
            Cancel
          </Button>
          
          {step === 'error' && (
            <Button 
              variant="outline"
              onClick={handleRetry}
              className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          
          {(step === 'display' || step === 'verifying') && (
            <Button 
              onClick={handleVerify}
              disabled={checking || !verificationData}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30"
            >
              {checking ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Account'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}