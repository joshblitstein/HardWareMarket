import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import SignupSelection from './pages/SignupSelection';
import BuyerSignup from './pages/BuyerSignup';
import SellerSignup from './pages/SellerSignup';
import BuyerDashboard from './pages/BuyerDashboard';
import BuyerDeals from './pages/BuyerDeals';
import BuyerOffers from './pages/BuyerOffers';
import ChangePassword from './pages/ChangePassword';
import SellerDashboard from './pages/SellerDashboard';
import SellerOrders from './pages/SellerOrders';
import SellerOffers from './pages/SellerOffers';
import SellerContracts from './pages/SellerContracts';
import SellerContractDetail from './pages/SellerContractDetail';
import CreateListing from './pages/CreateListing';
import DealDetails from './pages/DealDetails';
import ProductDetail from './pages/ProductDetail';
import PurchaseInitiation from './pages/PurchaseInitiation';
import MakeOffer from './pages/MakeOffer';
import ContractPage from './pages/ContractPage';
import AdminDashboard from './pages/AdminDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireVerified={false}>
                  <LandingPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupSelection />} />
            <Route path="/signup/buyer" element={<BuyerSignup />} />
            <Route path="/signup/seller" element={<SellerSignup />} />
            <Route 
              path="/buyer/dashboard" 
              element={
                <ProtectedRoute userType="buyer" requireVerified={true}>
                  <BuyerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mydeals" 
              element={
                <ProtectedRoute userType="buyer" requireVerified={true}>
                  <BuyerDeals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/myoffers" 
              element={
                <ProtectedRoute userType="buyer" requireVerified={true}>
                  <BuyerOffers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute requireVerified={false}>
                  <ChangePassword />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/dashboard" 
              element={
                <ProtectedRoute userType="seller" requireVerified={true}>
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/create-listing" 
              element={
                <ProtectedRoute userType="seller" requireVerified={true}>
                  <CreateListing />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/orders" 
              element={
                <ProtectedRoute userType="seller" requireVerified={true}>
                  <SellerOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/offers" 
              element={
                <ProtectedRoute userType="seller" requireVerified={true}>
                  <SellerOffers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/product/:id" 
              element={
                <ProtectedRoute requireVerified={false}>
                  <ProductDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/product/:id/purchase" 
              element={
                <ProtectedRoute userType="buyer" requireVerified={true}>
                  <PurchaseInitiation />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/product/:id/make-offer" 
              element={
                <ProtectedRoute userType="buyer" requireVerified={true}>
                  <MakeOffer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contract/:contractId" 
              element={
                <ProtectedRoute userType="buyer" requireVerified={true}>
                  <ContractPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/contracts" 
              element={
                <ProtectedRoute userType="seller" requireVerified={true}>
                  <SellerContracts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seller/contracts/:contractId" 
              element={
                <ProtectedRoute userType="seller" requireVerified={true}>
                  <SellerContractDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/deal/:dealId" 
              element={
                <ProtectedRoute requireVerified={false}>
                  <DealDetails />
                </ProtectedRoute>
              } 
            />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute userType="admin" requireVerified={false}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;