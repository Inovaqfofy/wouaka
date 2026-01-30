import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logoWouaka from '@/assets/logo-wouaka.png';

interface ComingSoonPageProps {
  onAccessGranted: () => void;
}

export function ComingSoonPage({ onAccessGranted }: ComingSoonPageProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    try {
      // Call edge function to verify password
      const response = await supabase.functions.invoke('verify-access-password', {
        body: { password }
      });
      
      if (response.error) {
        throw response.error;
      }

      if (response.data?.valid) {
        toast.success('Accès autorisé !');
        onAccessGranted();
      } else {
        toast.error('Mot de passe incorrect');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      toast.error('Erreur de vérification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A3D2C] via-[#0A3D2C] to-[#062419] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#D4A017]/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#D4A017]/5 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(212, 160, 23, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(212, 160, 23, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <img 
            src={logoWouaka} 
            alt="Wouaka" 
            className="h-16 w-auto drop-shadow-2xl"
          />
        </motion.div>

        {/* Coming Soon Badge */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <div className="bg-[#D4A017] text-[#0A3D2C] px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg">
            Bientôt disponible
          </div>
        </motion.div>

        {/* Main Card */}
        <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#D4A017]/20 flex items-center justify-center"
            >
              <Shield className="w-8 h-8 text-[#D4A017]" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-white">
              Accès Anticipé
            </CardTitle>
            <CardDescription className="text-white/70">
              Entrez le mot de passe pour découvrir Wouaka en avant-première
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#D4A017] focus:ring-[#D4A017]"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="w-full bg-[#D4A017] hover:bg-[#B8890F] text-[#0A3D2C] font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Accéder au site
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-white/50 text-sm mt-6"
        >
          Plateforme de scoring de crédit pour l'Afrique de l'Ouest
        </motion.p>
      </motion.div>
    </div>
  );
}
