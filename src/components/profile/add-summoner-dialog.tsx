'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Loader2 } from 'lucide-react';
import { IconVerificationDialog } from './icon-verification-dialog';

interface AddSummonerDialogProps {
  onAdd: () => void; // Changed to simple callback since verification handles the API call
}

const regions = [
  { value: 'na1', label: 'North America' },
  { value: 'euw1', label: 'Europe West' },
  { value: 'eun1', label: 'Europe Nordic & East' },
  { value: 'kr', label: 'Korea' },
  { value: 'jp1', label: 'Japan' },
  { value: 'br1', label: 'Brazil' },
  { value: 'la1', label: 'Latin America North' },
  { value: 'la2', label: 'Latin America South' },
  { value: 'oc1', label: 'Oceania' },
];

export function AddSummonerDialog({ onAdd }: AddSummonerDialogProps) {
  const [open, setOpen] = useState(false);
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region, setRegion] = useState('');
  const [loading] = useState(false);
  const [error, setError] = useState('');
  const [showIconVerification, setShowIconVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!gameName || !tagLine || !region) {
      setError('Please fill in all fields');
      return;
    }

    // Start icon verification process
    setShowIconVerification(true);
  };

  const handleVerificationSuccess = () => {
    // Reset form and close dialogs
    setGameName('');
    setTagLine('');
    setRegion('');
    setShowIconVerification(false);
    setOpen(false);
    
    // Notify parent to refresh summoners list
    onAdd();
  };

  const handleVerificationClose = () => {
    setShowIconVerification(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900/90 backdrop-blur-md border-slate-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add League Account</DialogTitle>
          <DialogDescription className="text-gray-400">
            Link your League of Legends account to track your performance
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gameName" className="text-sm font-medium text-gray-300">
                Summoner Name
              </Label>
              <Input 
                id="gameName"
                placeholder="YuumiMain"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder-gray-400 focus:border-blue-500/50"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="tagLine" className="text-sm font-medium text-gray-300">
                Tag Line
              </Label>
              <Input 
                id="tagLine"
                placeholder="NA1"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder-gray-400 focus:border-blue-500/50"
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="region" className="text-sm font-medium text-gray-300">
              Region
            </Label>
            <Select value={region} onValueChange={setRegion} disabled={loading}>
              <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white focus:border-blue-500/50">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-white">
                {regions.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
              className="bg-slate-800/50 border-slate-600/50 text-gray-300 hover:bg-slate-700/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !gameName || !tagLine || !region}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting Verification...
                </>
              ) : (
                'Start Verification'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* Icon Verification Dialog */}
      <IconVerificationDialog
        open={showIconVerification}
        onOpenChange={handleVerificationClose}
        gameName={gameName}
        tagLine={tagLine}
        region={region}
        onSuccess={handleVerificationSuccess}
      />
    </Dialog>
  );
}