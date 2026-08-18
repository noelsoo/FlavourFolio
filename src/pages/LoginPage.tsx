import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChefHat, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthError, useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/cookbooks" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, name);
      navigate('/cookbooks', { replace: true });
    } catch (err) {
      setError(
        err instanceof AuthError ? err.message : 'Something went wrong. Try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ChefHat className="size-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            FlavourFolio
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your recipes, meal plans and shopping lists in one place.
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <Tabs value={mode} onValueChange={(v) => { setMode(v as typeof mode); setError(null); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Create account</TabsTrigger>
              </TabsList>

              <form onSubmit={submit} className="mt-5 space-y-4">
                <TabsContent value="register" className="mt-0 space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Alex Chen"
                  />
                </TabsContent>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/8 p-2.5 text-sm"
                  >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" loading={busy}>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        {/*
          Being straight with the user about what this actually is, rather than
          implying their data is protected by a real account system.
        */}
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          This account is stored only in this browser — there is no server and the
          password is not checked. Your recipes stay on this device.
        </p>
      </div>
    </div>
  );
}
