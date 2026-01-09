import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, RefreshCw, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-wouaka.png";

const ServerError = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wouaka-deep via-wouaka-deep to-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-destructive/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-wouaka-lime/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-destructive/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238adb2f' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link to="/" className="inline-block">
            <img 
              src={logo} 
              alt="Wouaka" 
              className="h-16 w-auto mx-auto hover:scale-105 transition-transform duration-300" 
            />
          </Link>
        </motion.div>

        {/* 500 Number with warning icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mb-6"
        >
          <span className="text-[150px] sm:text-[200px] font-display font-bold leading-none bg-gradient-to-b from-orange-400 via-orange-500/80 to-orange-600/40 bg-clip-text text-transparent drop-shadow-lg">
            500
          </span>
          <motion.div 
            className="absolute top-4 right-1/4 sm:right-1/3"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <AlertTriangle className="h-12 w-12 text-orange-400" />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-orange-400/20 rounded-full blur-2xl animate-pulse" />
          </div>
        </motion.div>

        {/* Error message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4 mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">
            Erreur serveur
          </h1>
          <p className="text-lg text-white/70 max-w-md mx-auto">
            Nos serveurs rencontrent un problème temporaire. Notre équipe technique est sur le coup !
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-sm text-orange-300">Incident en cours de résolution</span>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            onClick={handleRefresh}
            size="lg"
            className="bg-wouaka-lime hover:bg-wouaka-lime/90 text-wouaka-deep font-semibold px-8 py-6 text-lg shadow-glow hover:shadow-glow-lg transition-all duration-300"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Réessayer
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-white/30 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-6 text-lg backdrop-blur-sm transition-all duration-300"
          >
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Retour à l'accueil
            </Link>
          </Button>
        </motion.div>

        {/* Contact support */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12"
        >
          <Link 
            to="/contact" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-wouaka-lime transition-colors duration-200 text-sm"
          >
            <Mail className="h-4 w-4" />
            Contacter le support technique
          </Link>
        </motion.div>
      </div>

      {/* Footer credit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="absolute bottom-6 text-center text-white/40 text-sm"
      >
        Wouaka Credit Score — L'inclusion financière par la data
      </motion.div>
    </div>
  );
};

export default ServerError;
