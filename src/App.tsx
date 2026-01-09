import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
// Public pages
import Index from "./pages/Index";
import Architecture from "./pages/Architecture";
import DataModel from "./pages/DataModel";
import FullArchitecture from "./pages/FullArchitecture";
import PrismaSchema from "./pages/PrismaSchema";
import FileStructure from "./pages/FileStructure";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Discover from "./pages/Discover";
import ApiDocs from "./pages/ApiDocs";
import Scoring from "./pages/Scoring";
import ScoreEducation from "./pages/ScoreEducation";
import Kyc from "./pages/Kyc";
import DataImport from "./pages/DataImport";
import Legal from "./pages/Legal";
import Terms from "./pages/Terms";
import About from "./pages/About";
import Solutions from "./pages/Solutions";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import PaymentConfirmation from "./pages/PaymentConfirmation";

// New strategic pages
import VsTraditional from "./pages/VsTraditional";
import Developers from "./pages/Developers";
import Impact from "./pages/Impact";

// Auth pages
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";

// Protected dashboards
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AnalystDashboard from "./pages/dashboard/AnalystDashboard";
import EnterpriseDashboard from "./pages/dashboard/EnterpriseDashboard";
import ApiClientDashboard from "./pages/dashboard/ApiClientDashboard";

// Admin sub-pages
import AdminUsers from "./pages/dashboard/admin/AdminUsers";
import AdminKyc from "./pages/dashboard/admin/AdminKyc";
import AdminScores from "./pages/dashboard/admin/AdminScores";
import AdminLogs from "./pages/dashboard/admin/AdminLogs";
import AdminSettings from "./pages/dashboard/admin/AdminSettings";
import AdminOrganizations from "./pages/dashboard/admin/AdminOrganizations";
import AdminMarketplace from "./pages/dashboard/admin/AdminMarketplace";
import AdminBilling from "./pages/dashboard/admin/AdminBilling";
import AdminWebhooks from "./pages/dashboard/admin/AdminWebhooks";
import AdminApiKeys from "./pages/dashboard/admin/AdminApiKeys";

// Analyst sub-pages
import AnalystKyc from "./pages/dashboard/analyst/AnalystKyc";
import AnalystScores from "./pages/dashboard/analyst/AnalystScores";
import AnalystClients from "./pages/dashboard/analyst/AnalystClients";
import AnalystReports from "./pages/dashboard/analyst/AnalystReports";
import AnalystSettings from "./pages/dashboard/analyst/AnalystSettings";

// Enterprise sub-pages
import EnterpriseScoreRequests from "./pages/dashboard/enterprise/EnterpriseScoreRequests";
import EnterpriseScores from "./pages/dashboard/enterprise/EnterpriseScores";
import EnterpriseMarketplace from "./pages/dashboard/enterprise/EnterpriseMarketplace";
import EnterpriseBilling from "./pages/dashboard/enterprise/EnterpriseBilling";
import EnterpriseSettings from "./pages/dashboard/enterprise/EnterpriseSettings";

// API Client sub-pages
import ApiClientKeys from "./pages/dashboard/api-client/ApiClientKeys";
import ApiClientUsage from "./pages/dashboard/api-client/ApiClientUsage";
import ApiClientWebhooks from "./pages/dashboard/api-client/ApiClientWebhooks";
import ApiClientLogs from "./pages/dashboard/api-client/ApiClientLogs";
import ApiClientBilling from "./pages/dashboard/api-client/ApiClientBilling";
import ApiClientSettings from "./pages/dashboard/api-client/ApiClientSettings";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/data-model" element={<DataModel />} />
            <Route path="/full-architecture" element={<FullArchitecture />} />
            <Route path="/prisma-schema" element={<PrismaSchema />} />
            <Route path="/file-structure" element={<FileStructure />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/decouvrir" element={<Discover />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route
              path="/scoring"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE', 'ENTREPRISE', 'API_CLIENT']}>
                  <Scoring />
                </ProtectedRoute>
              }
            />
            <Route path="/score-education" element={<ScoreEducation />} />
            <Route path="/kyc" element={<Kyc />} />
            <Route path="/data-import" element={<DataImport />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* New strategic pages */}
            <Route path="/vs-traditional" element={<VsTraditional />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/impact" element={<Impact />} />
            <Route path="/payment/confirmation" element={<PaymentConfirmation />} />
            
            {/* Auth routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            
            {/* Protected dashboard routes */}
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/users"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/kyc"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminKyc />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/scores"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminScores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/logs"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/organizations"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminOrganizations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/marketplace"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminMarketplace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/billing"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminBilling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/webhooks"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminWebhooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/api-keys"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminApiKeys />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analyst"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE']}>
                  <AnalystDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analyst/kyc"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE']}>
                  <AnalystKyc />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analyst/scores"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE']}>
                  <AnalystScores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analyst/clients"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE']}>
                  <AnalystClients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analyst/reports"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE']}>
                  <AnalystReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analyst/settings"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE']}>
                  <AnalystSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/enterprise"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE', 'ENTREPRISE']}>
                  <EnterpriseDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/enterprise/requests"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE', 'ENTREPRISE']}>
                  <EnterpriseScoreRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/enterprise/scores"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE', 'ENTREPRISE']}>
                  <EnterpriseScores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/enterprise/marketplace"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE', 'ENTREPRISE']}>
                  <EnterpriseMarketplace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/enterprise/billing"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE', 'ENTREPRISE']}>
                  <EnterpriseBilling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/enterprise/settings"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ANALYSTE', 'ENTREPRISE']}>
                  <EnterpriseSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/api-client"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'API_CLIENT']}>
                  <ApiClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/api-client/keys"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'API_CLIENT']}>
                  <ApiClientKeys />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/api-client/usage"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'API_CLIENT']}>
                  <ApiClientUsage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/api-client/webhooks"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'API_CLIENT']}>
                  <ApiClientWebhooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/api-client/logs"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'API_CLIENT']}>
                  <ApiClientLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/api-client/billing"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'API_CLIENT']}>
                  <ApiClientBilling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/api-client/settings"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'API_CLIENT']}>
                  <ApiClientSettings />
                </ProtectedRoute>
              }
            />
            
            {/* Error pages */}
            <Route path="/error-500" element={<ServerError />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
