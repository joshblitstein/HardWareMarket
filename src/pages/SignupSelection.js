import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
} from '@mui/material';
import {
  ShoppingCart,
  Store,
  ArrowForward,
} from '@mui/icons-material';

function SignupSelection() {
  const navigate = useNavigate();

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        py: 8,
        px: 4
      }}
    >
      <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center', mb: 6, maxWidth: 600 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 600,
              fontSize: '2.5rem',
              mb: 2,
              color: '#ffffff',
            }}
          >
            Join Nimbus Marketplace
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 300,
            }}
          >
            Choose your account type to get started
          </Typography>
        </Box>

        <Grid 
          container 
          spacing={4}
          sx={{ 
            maxWidth: 900,
            justifyContent: 'center',
            alignItems: 'stretch'
          }}
        >
          {/* Buyer Card */}
          <Grid item xs={12} sm={6} md={5}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  borderColor: 'rgba(159, 122, 234, 0.5)',
                  boxShadow: '0 12px 24px rgba(159, 122, 234, 0.2)',
                  backgroundColor: 'rgba(159, 122, 234, 0.1)',
                }
              }}
              onClick={() => navigate('/signup/buyer')}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(159, 122, 234, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <ShoppingCart sx={{ fontSize: 40, color: '#9F7AEA' }} />
                </Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 2,
                    color: '#ffffff',
                  }}
                >
                  I'm a Buyer
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    mb: 3,
                    minHeight: 60,
                  }}
                >
                  Browse listings, make offers, and purchase GPU servers from verified sellers
                </Typography>
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  fullWidth
                  sx={{
                    background: 'linear-gradient(90deg, #5A67D8 0%, #9F7AEA 100%)',
                    color: '#ffffff',
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(90deg, #4C51BF 0%, #805AD5 100%)',
                      boxShadow: '0 8px 16px rgba(159, 122, 234, 0.3)',
                    },
                  }}
                >
                  Sign up as Buyer
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Seller Card */}
          <Grid item xs={12} sm={6} md={5}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  borderColor: 'rgba(159, 122, 234, 0.5)',
                  boxShadow: '0 12px 24px rgba(159, 122, 234, 0.2)',
                  backgroundColor: 'rgba(159, 122, 234, 0.1)',
                }
              }}
              onClick={() => navigate('/signup/seller')}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(159, 122, 234, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <Store sx={{ fontSize: 40, color: '#9F7AEA' }} />
                </Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 2,
                    color: '#ffffff',
                  }}
                >
                  I'm a Seller
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    mb: 3,
                    minHeight: 60,
                  }}
                >
                  List your GPU servers, manage inventory, and receive offers from buyers
                </Typography>
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  fullWidth
                  sx={{
                    background: 'linear-gradient(90deg, #5A67D8 0%, #9F7AEA 100%)',
                    color: '#ffffff',
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500,
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(90deg, #4C51BF 0%, #805AD5 100%)',
                      boxShadow: '0 8px 16px rgba(159, 122, 234, 0.3)',
                    },
                  }}
                >
                  Sign up as Seller
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6, maxWidth: 600 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Already have an account?{' '}
            <Button
              onClick={() => navigate('/login')}
              sx={{
                color: '#9F7AEA',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(159, 122, 234, 0.1)',
                }
              }}
            >
              Sign in
            </Button>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default SignupSelection;

