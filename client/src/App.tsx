import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PropertyDetails from "@/pages/property-details";
import PropertiesPage from "@/pages/properties";
import LandCategories from "@/pages/land-categories";
import AuthPage from "@/pages/auth-page";
import BuyerDashboard from "@/pages/buyer-dashboard";
import SellerDashboard from "@/pages/seller-dashboard";
import AgentDashboard from "@/pages/agent-dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import ResourcesPage from "@/pages/resources";
import AnimationDemo from "@/pages/animation-demo";
import SellLandPage from "@/pages/sell-land";
import MarketReportsPage from "@/pages/market-reports";
import LandBuyingGuidePage from "@/pages/land-buying-guide";
import InvestmentToolsPage from "@/pages/investment-tools";
import HelpCenterPage from "@/pages/help-center";
import CreatePropertyPage from "@/pages/create-property";
import EditPropertyPage from "@/pages/edit-property";
import PropertyViewPage from "@/pages/property-view";
import InquirePage from "@/pages/inquire";
import MessagesPage from "@/pages/messages";
import AgentDirectory from "@/pages/agents";
import AgentProfile from "@/pages/agent-details";
import Teams from "@/pages/teams";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import DiagnosticsPanel from "@/components/diagnostics/DiagnosticsPanel";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0F172A] text-[#CBD5E1]">
      <Header />
      <main className="flex-grow pt-14 md:pt-16 pb-16 md:pb-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/properties" component={PropertiesPage} />
          <Route path="/property/:id" component={PropertyDetails} />
          <Route path="/land-categories" component={LandCategories} />
          <Route path="/sell-land" component={SellLandPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/resources" component={ResourcesPage} />
          <Route path="/agents" component={AgentDirectory} />
          <Route path="/agents/:id" component={AgentProfile} />
          <Route path="/teams" component={Teams} />
          <Route path="/buyer/dashboard">
            <ProtectedRoute requiredRole="buyer">
              <BuyerDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/seller/dashboard">
            <ProtectedRoute requiredRole="seller">
              <SellerDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/agent/dashboard">
            <ProtectedRoute requiredRole="agent">
              <AgentDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/dashboard">
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/properties/create" component={CreatePropertyPage} />
          <Route path="/properties/:id/edit" component={EditPropertyPage} />
          <Route path="/properties/:id" component={PropertyDetails} />
          <Route path="/inquire/:id" component={InquirePage} />
          <Route path="/messages" component={MessagesPage} />
          <Route path="/market-reports" component={MarketReportsPage} />
          <Route path="/land-buying-guide" component={LandBuyingGuidePage} />
          <Route path="/investment-tools" component={InvestmentToolsPage} />
          <Route path="/help-center" component={HelpCenterPage} />
          <Route path="/unauthorized">
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-3xl font-bold mb-4 text-white">Access Denied</h1>
              <p className="text-gray-400 mb-8">You don't have permission to access this page.</p>
              <a href="/" className="text-primary hover:underline">Return to Home</a>
            </div>
          </Route>
          <Route path="/animation-demo" component={AnimationDemo} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
        {/* Include the diagnostics panel - only visible in development environment */}
        <DiagnosticsPanel />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
