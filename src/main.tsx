import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

/**
 * Domain-based Application Router
 * - sandbox.wouaka-creditscore.com → Developer Portal (SandboxApp)
 * - www.wouaka-creditscore.com → Main Application (App)
 * - *.lovable.app (preview) → Check for sandbox in URL path
 */
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

// Detect sandbox subdomain
const isSandboxSubdomain = hostname.startsWith('sandbox.');

// For preview environments, also check if URL indicates sandbox context
const isPreviewSandbox = hostname.includes('lovable.app') && (
  pathname.startsWith('/sandbox') || 
  pathname.startsWith('/developer') ||
  pathname.startsWith('/api-reference') ||
  pathname.startsWith('/status') ||
  pathname.startsWith('/webhooks')
);

// Determine which app to load
const shouldLoadSandbox = isSandboxSubdomain || isPreviewSandbox;

if (shouldLoadSandbox) {
  // Load Developer Portal
  import("./apps/sandbox/SandboxApp").then(({ default: SandboxApp }) => {
    createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <SandboxApp />
      </React.StrictMode>
    );
  });
} else {
  // Load Main Application
  import("./App").then(({ default: App }) => {
    createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
}
