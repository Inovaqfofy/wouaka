import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";

// Sandbox pages
import Developer from "./pages/Developer";
import DeveloperSandbox from "./pages/DeveloperSandbox";
import DeveloperStatus from "./pages/DeveloperStatus";
import DeveloperWebhooks from "./pages/DeveloperWebhooks";
import ApiDocs from "./pages/ApiDocs";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

/**
 * Sandbox Application Entry Point
 * This app is served on sandbox.wouaka-creditscore.com
 */
const SandboxApp = () => (
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Main documentation */}
                <Route path="/" element={<Developer />} />
                
                {/* Sandbox simulator */}
                <Route path="/sandbox" element={<DeveloperSandbox />} />
                
                {/* API Status */}
                <Route path="/status" element={<DeveloperStatus />} />
                
                {/* Webhooks management */}
                <Route path="/webhooks" element={<DeveloperWebhooks />} />
                
                {/* OpenAPI Reference */}
                <Route path="/api-reference" element={<ApiDocs />} />
                
                {/* Legacy redirects */}
                <Route path="/developer" element={<Navigate to="/" replace />} />
                <Route path="/developer/sandbox" element={<Navigate to="/sandbox" replace />} />
                <Route path="/developer/status" element={<Navigate to="/status" replace />} />
                <Route path="/developer/webhooks" element={<Navigate to="/webhooks" replace />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);

export default SandboxApp;
