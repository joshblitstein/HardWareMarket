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
} from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';

function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, userProfile } = useAuth();
  const navigate = useNavigate();
  
  // Handle redirect after successful login
  useEffect(() => {
    if (loginSuccess && userProfile) {
      // Verify user is actually an admin
      if (userProfile.userType === 'admin') {
        navigate('/admin/dashboard');
        setLoginSuccess(false);
      } else {
        setError('Access denied. Only admin users can access this login page.');
        setLoading(false);
        setLoginSuccess(false);
      }
    }
  }, [loginSuccess, userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    
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
            <AdminPanelSettings sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                color: '#1a1a1a',
                mb: 1
              }}
            >
              Nimbus Admin
            </Typography>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 300 }}>
              Admin Portal Access
            </Typography>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Admin Email"
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
              variant="contained"
              sx={{ 
                backgroundColor: '#1976d2',
                color: 'white',
                py: 1.5,
                mb: 2,
                '&:hover': {
                  backgroundColor: '#1565c0'
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#999'
                }
              }}
              disabled={loading || !email || !password}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In as Admin'}
            </Button>
            
            <Box textAlign="center" mt={2}>
              <Link 
                to="/login" 
                style={{ 
                  textDecoration: 'none',
                  color: '#666',
                  fontSize: '0.875rem'
                }}
              >
                Regular User Login →
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default AdminLoginPage;

