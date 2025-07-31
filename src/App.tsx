import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Navigation from "@/components/layout/Navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AuthPage from "@/components/auth/AuthPage";
import Dashboard from "./pages/Dashboard";
import ReportIncident from "./pages/ReportIncident";
import IncidentsList from "./pages/IncidentsList";
import IncidentDetails from "./pages/IncidentDetails";
import MapView from "./pages/MapView";
import AdminPanel from "./pages/AdminPanel";
import SecurityDashboard from "./pages/SecurityDashboard";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <Dashboard />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/report" element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <ReportIncident />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/incidents" element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <IncidentsList />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/incidents/:id" element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <IncidentDetails />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/map" element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <MapView />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <AdminPanel />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/security" element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <SecurityDashboard />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <Notifications />
                  </>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <Profile />
                  </>
                </ProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
