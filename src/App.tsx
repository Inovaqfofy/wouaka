import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ComingSoonGate } from "@/components/maintenance";

// Public pages
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";
import Terms from "./pages/Terms";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import SubmitDocuments from "./pages/SubmitDocuments";
import Partenaires from "./pages/Partenaires";
import Developer from "./pages/Developer";
import DeveloperSandbox from "./pages/DeveloperSandbox";
import DeveloperStatus from "./pages/DeveloperStatus";
import DeveloperWebhooks from "./pages/DeveloperWebhooks";
import ApiDocs from "./pages/ApiDocs";
import ROISimulator from "./pages/ROISimulator";
import Compliance from "./pages/Compliance";

// Auth pages
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";

// Protected dashboards
import AdminDashboard from "./pages/dashboard/AdminDashboard";

// Admin sub-pages
import AdminUsers from "./pages/dashboard/admin/AdminUsers";
import AdminKyc from "./pages/dashboard/admin/AdminKyc";
import AdminCertificates from "./pages/dashboard/admin/AdminCertificates";
import AdminLogs from "./pages/dashboard/admin/AdminLogs";
import AdminSettings from "./pages/dashboard/admin/AdminSettings";
import AdminOrganizations from "./pages/dashboard/admin/AdminOrganizations";
import AdminMarketplace from "./pages/dashboard/admin/AdminMarketplace";
import AdminBilling from "./pages/dashboard/admin/AdminBilling";
import AdminWebhooks from "./pages/dashboard/admin/AdminWebhooks";
import AdminApiKeys from "./pages/dashboard/admin/AdminApiKeys";
import TechnicalMonitoring from "./pages/dashboard/admin/TechnicalMonitoring";
import AMLInvestigations from "./pages/dashboard/admin/AMLInvestigations";
import AdminAnalytics from "./pages/dashboard/admin/AdminAnalytics";
import AdminComplianceCertificate from "./pages/dashboard/admin/AdminComplianceCertificate";
import AIMonitoring from "./pages/dashboard/admin/AIMonitoring";
import SecurityWatch from "./pages/dashboard/admin/SecurityWatch";
import SecurityTests from "./pages/dashboard/admin/SecurityTests";
import EmergencyControl from "./pages/dashboard/admin/EmergencyControl";
import LockdownMonitor from "./pages/dashboard/admin/LockdownMonitor";

// Partner sub-pages
import PartnerDashboard from "./pages/dashboard/partner/PartnerDashboard";
import PartnerClients from "./pages/dashboard/partner/PartnerClients";
import PartnerClientDetail from "./pages/dashboard/partner/PartnerClientDetail";
import PartnerEvaluations from "./pages/dashboard/partner/PartnerEvaluations";
import PartnerKyc from "./pages/dashboard/partner/PartnerKyc";
import PartnerKycDetail from "./pages/dashboard/partner/PartnerKycDetail";
import PartnerOffers from "./pages/dashboard/partner/PartnerOffers";
import PartnerApplications from "./pages/dashboard/partner/PartnerApplications";
import PartnerApiKeys from "./pages/dashboard/partner/PartnerApiKeys";
import PartnerWebhooks from "./pages/dashboard/partner/PartnerWebhooks";
import PartnerApiUsage from "./pages/dashboard/partner/PartnerApiUsage";
import PartnerApiLogs from "./pages/dashboard/partner/PartnerApiLogs";
import PartnerBilling from "./pages/dashboard/partner/PartnerBilling";
import PartnerSettings from "./pages/dashboard/partner/PartnerSettings";
import PartnerEvaluationDetail from "./pages/dashboard/partner/PartnerEvaluationDetail";
import PartnerProofDossier from "./pages/dashboard/partner/PartnerProofDossier";
import PartnerValidateCertificate from "./pages/dashboard/partner/PartnerValidateCertificate";

import BorrowerDashboard from "./pages/dashboard/borrower/BorrowerDashboard";
import BorrowerScore from "./pages/dashboard/borrower/BorrowerScore";
import BorrowerDocuments from "./pages/dashboard/borrower/BorrowerDocuments";
import BorrowerApplications from "./pages/dashboard/borrower/BorrowerApplications";
import BorrowerOffers from "./pages/dashboard/borrower/BorrowerOffers";
import BorrowerProfile from "./pages/dashboard/borrower/BorrowerProfile";
import BorrowerSupport from "./pages/dashboard/borrower/BorrowerSupport";

// Support pages
import AdminSupport from "./pages/dashboard/admin/AdminSupport";
import TicketDetailPage from "./pages/dashboard/TicketDetailPage";

// Public marketplace pages
import Marketplace from "./pages/Marketplace";
import MarketplaceProduct from "./pages/MarketplaceProduct";
import ApplyForLoan from "./pages/ApplyForLoan";

// Shared results
import SharedResult from "./pages/SharedResult";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <ComingSoonGate>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/partenaires" element={<Partenaires />} />
                <Route path="/developer" element={<Developer />} />
                <Route path="/developer/sandbox" element={<DeveloperSandbox />} />
                <Route path="/developer/status" element={<DeveloperStatus />} />
                <Route path="/developer/webhooks" element={<DeveloperWebhooks />} />
                <Route path="/api-reference" element={<ApiDocs />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/simulateur-roi" element={<ROISimulator />} />
                <Route path="/payment/confirmation" element={<PaymentConfirmation />} />
                
                {/* Public document submission */}
                <Route path="/submit-documents/:token" element={<SubmitDocuments />} />
                
                {/* Public shared results */}
                <Route path="/shared/:token" element={<SharedResult />} />
                
                {/* Public marketplace */}
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/:productId" element={<MarketplaceProduct />} />
                <Route path="/apply/:productId" element={<ApplyForLoan />} />
                
                {/* Auth routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                
                {/* Admin Dashboard */}
                <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/admin/users" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminUsers /></ProtectedRoute>} />
                <Route path="/dashboard/admin/kyc" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminKyc /></ProtectedRoute>} />
                <Route path="/dashboard/admin/certificates" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminCertificates /></ProtectedRoute>} />
                {/* Legacy redirect: scores -> certificates */}
                <Route path="/dashboard/admin/scores" element={<Navigate to="/dashboard/admin/certificates" replace />} />
                <Route path="/dashboard/admin/logs" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminLogs /></ProtectedRoute>} />
                <Route path="/dashboard/admin/settings" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminSettings /></ProtectedRoute>} />
                <Route path="/dashboard/admin/organizations" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminOrganizations /></ProtectedRoute>} />
                <Route path="/dashboard/admin/marketplace" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminMarketplace /></ProtectedRoute>} />
                <Route path="/dashboard/admin/billing" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminBilling /></ProtectedRoute>} />
                <Route path="/dashboard/admin/webhooks" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminWebhooks /></ProtectedRoute>} />
                <Route path="/dashboard/admin/api-keys" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminApiKeys /></ProtectedRoute>} />
                <Route path="/dashboard/admin/monitoring" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><TechnicalMonitoring /></ProtectedRoute>} />
                <Route path="/dashboard/admin/aml" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AMLInvestigations /></ProtectedRoute>} />
                <Route path="/dashboard/admin/analytics" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminAnalytics /></ProtectedRoute>} />
                <Route path="/dashboard/admin/compliance-certificate" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminComplianceCertificate /></ProtectedRoute>} />
                <Route path="/dashboard/admin/ai-monitoring" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AIMonitoring /></ProtectedRoute>} />
                <Route path="/dashboard/admin/security" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SecurityWatch /></ProtectedRoute>} />
                <Route path="/dashboard/admin/emergency" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><EmergencyControl /></ProtectedRoute>} />
                <Route path="/dashboard/admin/lockdown-monitor" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><LockdownMonitor /></ProtectedRoute>} />
                <Route path="/dashboard/admin/security-tests" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SecurityTests /></ProtectedRoute>} />
                <Route path="/dashboard/admin/support" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><AdminSupport /></ProtectedRoute>} />
                <Route path="/dashboard/admin/support/:ticketId" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><TicketDetailPage /></ProtectedRoute>} />
                
                {/* Partner Dashboard */}
                <Route path="/dashboard/partner" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/partner/validate" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerValidateCertificate /></ProtectedRoute>} />
                <Route path="/dashboard/partner/clients" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerClients /></ProtectedRoute>} />
                <Route path="/dashboard/partner/clients/:clientId" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerClientDetail /></ProtectedRoute>} />
                <Route path="/dashboard/partner/evaluations" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerEvaluations /></ProtectedRoute>} />
                <Route path="/dashboard/partner/evaluations/:evaluationId" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerEvaluationDetail /></ProtectedRoute>} />
                <Route path="/dashboard/partner/evaluations/:evaluationId/proof" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerProofDossier /></ProtectedRoute>} />
                <Route path="/dashboard/partner/kyc" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerKyc /></ProtectedRoute>} />
                <Route path="/dashboard/partner/kyc/:kycId" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerKycDetail /></ProtectedRoute>} />
                <Route path="/dashboard/partner/offers" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerOffers /></ProtectedRoute>} />
                <Route path="/dashboard/partner/applications" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerApplications /></ProtectedRoute>} />
                <Route path="/dashboard/partner/api-keys" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerApiKeys /></ProtectedRoute>} />
                <Route path="/dashboard/partner/webhooks" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerWebhooks /></ProtectedRoute>} />
                <Route path="/dashboard/partner/api-usage" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerApiUsage /></ProtectedRoute>} />
                <Route path="/dashboard/partner/api-logs" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerApiLogs /></ProtectedRoute>} />
                <Route path="/dashboard/partner/billing" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerBilling /></ProtectedRoute>} />
                <Route path="/dashboard/partner/settings" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'PARTENAIRE']}><PartnerSettings /></ProtectedRoute>} />
                
                {/* Borrower Dashboard */}
                <Route path="/dashboard/borrower" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EMPRUNTEUR']}><BorrowerDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/borrower/score" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EMPRUNTEUR']}><BorrowerScore /></ProtectedRoute>} />
                <Route path="/dashboard/borrower/documents" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EMPRUNTEUR']}><BorrowerDocuments /></ProtectedRoute>} />
                <Route path="/dashboard/borrower/applications" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EMPRUNTEUR']}><BorrowerApplications /></ProtectedRoute>} />
                <Route path="/dashboard/borrower/offers" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EMPRUNTEUR']}><BorrowerOffers /></ProtectedRoute>} />
                <Route path="/dashboard/borrower/profile" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EMPRUNTEUR']}><BorrowerProfile /></ProtectedRoute>} />
                <Route path="/dashboard/borrower/support" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EMPRUNTEUR']}><BorrowerSupport /></ProtectedRoute>} />
                <Route path="/dashboard/borrower/support/:ticketId" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EMPRUNTEUR']}><TicketDetailPage /></ProtectedRoute>} />
                
                {/* Legacy redirect: old credits page -> score page */}
                <Route path="/dashboard/borrower/credits" element={<Navigate to="/dashboard/borrower/score" replace />} />
                
                {/* Legacy redirects */}
                <Route path="/solutions" element={<Navigate to="/partenaires" replace />} />
                <Route path="/developers" element={<Navigate to="/developer" replace />} />
                <Route path="/api-docs" element={<Navigate to="/developer" replace />} />
                <Route path="/docs" element={<Navigate to="/developer" replace />} />
                <Route path="/products/*" element={<Navigate to="/partenaires#produits" replace />} />
                <Route path="/vs-traditional" element={<Navigate to="/partenaires" replace />} />
                <Route path="/impact" element={<Navigate to="/about" replace />} />
                <Route path="/scoring" element={<Navigate to="/dashboard/partner" replace />} />
                <Route path="/kyc" element={<Navigate to="/dashboard/partner" replace />} />
                <Route path="/dashboard/enterprise/*" element={<Navigate to="/dashboard/partner" replace />} />
                <Route path="/dashboard/analyst/*" element={<Navigate to="/dashboard/partner" replace />} />
                <Route path="/dashboard/api-client/*" element={<Navigate to="/dashboard/partner" replace />} />
                
                {/* Error pages */}
                <Route path="/error-500" element={<ServerError />} />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ComingSoonGate>
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
