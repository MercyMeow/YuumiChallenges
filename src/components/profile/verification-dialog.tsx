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
import { Copy, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summoner: {
    id: string;
    name: string;
    tag_line: string;
    verification_code?: string;
  } | null;
  onVerify: (id: string, code: string) => Promise<void>;
  onNewCode: (id: string) => Promise<void>;
}

export function VerificationDialog({
  open,
  onOpenChange,
  summoner,
  onVerify,
  onNewCode,
}: VerificationDialogProps) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setError('');
      setSuccess(false);
    }
  }, [open]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleVerify = async () => {
    if (!summoner?.verification_code) return;

    setChecking(true);
    setError('');

    try {
      await onVerify(summoner.id, summoner.verification_code);
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setChecking(false);
    }
  };

  const handleNewCode = async () => {
    if (!summoner?.id) return;

    setChecking(true);
    setError('');

    try {
      await onNewCode(summoner.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate new code');
    } finally {
      setChecking(false);
    }
  };

  if (!summoner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900/90 backdrop-blur-md border-slate-700/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Verify Your Account</DialogTitle>
          <DialogDescription className="text-gray-400">
            Follow these steps to verify ownership of {summoner.name}#{summoner.tag_line}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {success ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Account verified successfully! You can now participate in challenges.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h3 className="font-semibold text-blue-400 mb-2">Step 1: Copy Verification Code</h3>
                <div className="flex items-center space-x-2">
                  <code className="bg-slate-800/50 px-3 py-2 rounded font-mono text-sm flex-1">
                    {summoner.verification_code || 'Loading...'}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(summoner.verification_code || '')}
                    className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h3 className="font-semibold text-purple-400 mb-2">Step 2: Create Item Set</h3>
                <ol className="text-sm space-y-1 text-gray-400">
                  <li>1. Open League of Legends client</li>
                  <li>2. Go to Collection → Item Sets</li>
                  <li>3. Create new item set</li>
                  <li>4. Name it exactly: <code className="bg-slate-800/50 px-1 rounded">"{summoner.verification_code}"</code></li>
                  <li>5. Save the item set</li>
                </ol>
              </div>
              
              <div className="flex items-center justify-center space-x-2 py-2">
                <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-400">
                  {checking ? 'Checking for verification...' : 'Ready to verify'}
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
          {!success && (
            <>
              <Button 
                variant="outline"
                onClick={handleNewCode}
                disabled={checking}
                className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30"
              >
                New Code
              </Button>
              <Button 
                onClick={handleVerify}
                disabled={checking || !summoner.verification_code}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30"
              >
                {checking ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Now'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}