import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/admin";

// Test Pages
import AdminTest from "./pages/test/AdminTest";
import KabapasTest from "./pages/test/KabapasTest";
import KasubsieTest from "./pages/test/KasubsieTest";
import OperatorRegistrasiTest from "./pages/test/OperatorRegistrasiTest";
import AnevTest from "./pages/test/AnevTest";
import PKTest from "./pages/test/PKTest";
import PersuratanTest from "./pages/test/PersuratanTest";
import BimkerTest from "./pages/test/BimkerTest";
import BimkemasTest from "./pages/test/BimkemasTest";
import TPPTest from "./pages/test/TPPTest";
import LaporanTest from "./pages/test/LaporanTest";
import KasieTest from "./pages/test/KasieTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute permission="access_dashboard">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Panel */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute permission="access_admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Test Pages - Each protected by specific permission */}
            <Route
              path="/test/admin"
              element={
                <ProtectedRoute permission="access_admin">
                  <AdminTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/kabapas"
              element={
                <ProtectedRoute permission="access_kabapas">
                  <KabapasTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/kasubsie"
              element={
                <ProtectedRoute permission="access_kasubsie">
                  <KasubsieTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/operator-registrasi"
              element={
                <ProtectedRoute permission="access_operator_registrasi">
                  <OperatorRegistrasiTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/anev"
              element={
                <ProtectedRoute permission="access_anev">
                  <AnevTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/pk"
              element={
                <ProtectedRoute permission="access_pk">
                  <PKTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/persuratan"
              element={
                <ProtectedRoute permission="access_persuratan">
                  <PersuratanTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/bimker"
              element={
                <ProtectedRoute permission="access_bimker">
                  <BimkerTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/bimkemas"
              element={
                <ProtectedRoute permission="access_bimkemas">
                  <BimkemasTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/tpp"
              element={
                <ProtectedRoute permission="access_tpp">
                  <TPPTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/laporan"
              element={
                <ProtectedRoute permission="access_laporan">
                  <LaporanTest />
                </ProtectedRoute>
              }
            />

            <Route
              path="/test/kasie"
              element={
                <ProtectedRoute permission="access_kasie">
                  <KasieTest />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
