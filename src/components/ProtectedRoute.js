import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

export function ProtectedRoute({ children, userType, requireVerified = false }) {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography>Loading your profile...</Typography>
      </Box>
    );
  }

  if (userType && userProfile.userType !== userType) {
    return <Navigate to={`/${userProfile.userType}/dashboard`} replace />;
  }

  if (requireVerified && !userProfile.verified) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh"
        gap={2}
        p={3}
      >
        <Typography variant="h5" color="primary">
          Account Verification Required
        </Typography>
        <Typography variant="body1" textAlign="center">
          Your account is being reviewed by our team. You'll receive an email once verification is complete.
        </Typography>
      </Box>
    );
  }

  return children;
}
