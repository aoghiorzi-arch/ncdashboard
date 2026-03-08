import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Lock, Monitor } from 'lucide-react';
import { getSettings } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

const MicrosoftLogo = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const settings = getSettings();
  const sharePointEnabled = settings.sharePoint?.enabled;
  const [name, setName] = useState('');

  const handleLocalLogin = () => {
    if (!name.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }
    localStorage.setItem('nc_current_user', name.trim());
    navigate('/');
  };

  const handleMicrosoftSSO = () => {
    if (!sharePointEnabled) {
      toast({
        title: 'SharePoint not configured',
        description: 'Enable SharePoint integration in Settings to use Microsoft SSO.',
      });
      return;
    }
    // Future: redirect to Azure AD OAuth flow
    toast({ title: 'Microsoft SSO', description: 'Azure AD integration coming soon.' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-2">
            <Monitor className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{settings.platformName}</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Microsoft SSO */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full h-11 gap-3 text-sm font-medium"
              onClick={handleMicrosoftSSO}
              disabled={!sharePointEnabled}
            >
              <MicrosoftLogo />
              Sign in with Microsoft
              {!sharePointEnabled && (
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
                  Coming soon
                </Badge>
              )}
            </Button>
            {!sharePointEnabled && (
              <p className="text-[11px] text-muted-foreground text-center">
                Configure SharePoint in Settings to enable corporate SSO
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or continue locally</span>
            <Separator className="flex-1" />
          </div>

          {/* Local login */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Your name</Label>
              <Input
                id="name"
                placeholder="e.g. Alex"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLocalLogin()}
              />
            </div>
            <Button className="w-full" onClick={handleLocalLogin}>
              <Lock className="w-4 h-4 mr-2" />
              Continue to Dashboard
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Local mode stores all data in your browser. Connect SharePoint for cloud sync and team collaboration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
