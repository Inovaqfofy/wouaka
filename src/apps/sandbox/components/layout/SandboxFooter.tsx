import { Link } from "react-router-dom";
import { Code2, ExternalLink } from "lucide-react";
import { getMainSiteUrl, SANDBOX_CONFIG } from "../../lib/sandbox-config";

export const SandboxFooter = () => {
  return (
    <footer className="bg-[#0A3D2C] border-t border-white/10 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Branding */}
          <div className="flex items-center gap-2 text-white/70">
            <Code2 className="w-5 h-5 text-[#D4A017]" />
            <span>WOUAKA Developer Portal v{SANDBOX_CONFIG.version}</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-white/60 hover:text-white transition-colors">
              Documentation
            </Link>
            <Link to="/api-reference" className="text-white/60 hover:text-white transition-colors">
              API Reference
            </Link>
            <a 
              href={getMainSiteUrl("/contact")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors flex items-center gap-1"
            >
              Support
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href={getMainSiteUrl("/terms")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white transition-colors flex items-center gap-1"
            >
              CGU
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-white/50 text-sm">
            © {new Date().getFullYear()} Wouaka. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  );
};
