import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Handle redirect after successful login
  useEffect(() => {
    if (loginSuccess && userProfile) {
      let redirectPath = '/';
      if (userProfile.userType === 'admin') {
        redirectPath = '/admin/dashboard';
      } else if (userProfile.userType === 'seller') {
        redirectPath = '/seller/create-listing';
      }
      // Buyers should stay on landing page (/)
      navigate(redirectPath);
      setLoginSuccess(false);
    }
  }, [loginSuccess, userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUserTypeChange = (event, newUserType) => {
    if (newUserType !== null) {
      setUserType(newUserType);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!userType) {
      setError('Please select whether you are a buyer or seller');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      setLoginSuccess(true);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        backgroundColor: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={0} 
          sx={{ 
            padding: 6,
            borderRadius: 2,
            backgroundColor: 'white',
            maxWidth: 400,
            mx: 'auto'
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                color: '#1a1a1a',
                mb: 1
              }}
            >
              Nimbus
            </Typography>
            <Typography variant="h5" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
              Welcome
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mt: 1 }}>
              Log in to Nimbus to continue
            </Typography>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit}>
            <Box mb={3}>
              <Typography variant="body2" sx={{ color: '#666', mb: 2, textAlign: 'center' }}>
                I am a:
              </Typography>
              <ToggleButtonGroup
                value={userType}
                exclusive
                onChange={handleUserTypeChange}
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    border: '1px solid #e0e0e0',
                    color: '#666',
                    '&.Mui-selected': {
                      backgroundColor: '#1a1a1a',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#333'
                      }
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }
                }}
              >
                <ToggleButton value="buyer">
                  Buyer
                </ToggleButton>
                <ToggleButton value="seller">
                  Seller
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              sx={{ 
                backgroundColor: '#1a1a1a',
                color: 'white',
                py: 1.5,
                mb: 3,
                '&:hover': {
                  backgroundColor: '#333'
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#999'
                }
              }}
              disabled={loading || !userType}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Continue'}
            </Button>
            
            <Box textAlign="center">
              <Typography variant="body2" sx={{ color: '#666' }}>
                Don't have an account?{' '}
                <Link 
                  to="/signup/buyer" 
                  style={{ 
                    textDecoration: 'none',
                    color: '#1976d2',
                    fontWeight: 500
                  }}
                >
                  Sign up as Buyer
                </Link>
                {' or '}
                <Link 
                  to="/signup/seller" 
                  style={{ 
                    textDecoration: 'none',
                    color: '#1976d2',
                    fontWeight: 500
                  }}
                >
                  Sign up as Seller
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;
