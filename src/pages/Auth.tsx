import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, ArrowLeft, CheckCircle, Building2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import logoWouaka from '@/assets/logo-wouaka.png';
import { validatePasswordNotBreached } from '@/lib/password-breach-check';
import { sendWelcomeEmailDirect } from '@/hooks/useWelcomeEmailProcessor';
import { 
  SIGNUP_ROLES, 
  SIGNUP_ROLE_LABELS,
  DASHBOARD_ROUTES,
  type SignupRole,
  type AppRole 
} from '@/lib/roles';

// Validation schemas
const emailSchema = z.string().email('Email invalide').max(255, 'Email trop long');
const passwordSchema = z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').max(72, 'Mot de passe trop long');
const nameSchema = z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Nom trop long');

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signupSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, signIn, signUp, resetPassword, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<SignupRole>('EMPRUNTEUR');
  const [loading, setLoading] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset errors when changing tab
  const handleTabChange = (tab: string) => {
    setError(null);
    setSuccess(null);
    setActiveTab(tab as 'login' | 'signup');
    setMode(tab as AuthMode);
  };

  // Redirect authenticated users
  useEffect(() => {
    if (user && role && !authLoading) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || DASHBOARD_ROUTES[role] || '/', { replace: true });
    }
  }, [user, role, authLoading, navigate, location]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      loginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter');
      } else {
        setError('Erreur de connexion. Veuillez réessayer.');
      }
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      signupSchema.parse({ fullName, email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    // Check for breached password before signup
    setCheckingPassword(true);
    const breachError = await validatePasswordNotBreached(password);
    setCheckingPassword(false);
    
    if (breachError) {
      setError(breachError);
      return;
    }

    setLoading(true);
    const { error, data } = await signUp(email, password, fullName, selectedRole);
    setLoading(false);

    if (error) {
      if (error.message.includes('User already registered')) {
        setError('Un compte existe déjà avec cet email');
      } else {
        setError('Erreur lors de l\'inscription. Veuillez réessayer.');
      }
    } else {
      // Déclencher l'envoi de l'email de bienvenue de manière asynchrone (non-bloquant)
      // Le trigger SQL crée la tâche, mais on peut aussi envoyer directement comme backup
      if (data?.user) {
        sendWelcomeEmailDirect(email, fullName, data.user.id).catch((err) => {
          console.warn('[Auth] Email de bienvenue non envoyé (backup):', err);
        });
      }
      setSuccess('Compte créé avec succès ! Un email de bienvenue vous a été envoyé.');
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setError('Erreur lors de l\'envoi du lien. Veuillez réessayer.');
    } else {
      setSuccess('Un lien de réinitialisation a été envoyé à votre email.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home link */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <img src={logoWouaka} alt="Wouaka" className="w-16 h-16 rounded-xl" />
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Wouaka Credit Score</h1>
          <p className="text-muted-foreground mt-2">
            Plateforme de notation de crédit pour l'Afrique de l'Ouest
          </p>
        </div>

        {mode === 'forgot-password' ? (
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <button
                  onClick={() => setMode('login')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                Mot de passe oublié
              </CardTitle>
              <CardDescription>
                Entrez votre email pour recevoir un lien de réinitialisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="border-green-500 bg-green-50 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer le lien'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-premium">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <CardHeader>
                  <CardTitle>Bienvenue</CardTitle>
                  <CardDescription>
                    Connectez-vous à votre compte Wouaka
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {success && (
                      <Alert className="border-green-500 bg-green-50 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="vous@exemple.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Mot de passe</Label>
                        <button
                          type="button"
                          onClick={() => setMode('forgot-password')}
                          className="text-sm text-primary hover:underline"
                        >
                          Mot de passe oublié ?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Connexion...
                        </>
                      ) : (
                        'Se connecter'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="signup">
                <CardHeader>
                  <CardTitle>Créer un compte</CardTitle>
                  <CardDescription>
                    Inscrivez-vous pour accéder à Wouaka Credit Score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {success && (
                      <Alert className="border-green-500 bg-green-50 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nom complet</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Jean Dupont"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="vous@exemple.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum 8 caractères
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>Je suis un(e)</Label>
                      <div className="grid gap-3">
                        {SIGNUP_ROLES.map((role) => (
                          <div
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedRole === role 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              selectedRole === role ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              {role === 'EMPRUNTEUR' ? (
                                <User className="w-5 h-5" />
                              ) : (
                                <Building2 className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{SIGNUP_ROLE_LABELS[role].label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {SIGNUP_ROLE_LABELS[role].description}
                              </p>
                            </div>
                            {selectedRole === role && (
                              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || checkingPassword}>
                      {checkingPassword ? (
                        <>
                          <ShieldAlert className="w-4 h-4 animate-pulse mr-2" />
                          Vérification sécurité...
                        </>
                      ) : loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Création du compte...
                        </>
                      ) : (
                        "Créer mon compte"
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      En créant un compte, vous acceptez nos{' '}
                      <Link to="/terms" className="text-primary hover:underline">
                        Conditions d'utilisation
                      </Link>{' '}
                      et notre{' '}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Politique de confidentialité
                      </Link>
                    </p>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  );
}
