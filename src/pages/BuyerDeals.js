import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Tab,
  Tabs,
  Badge,
} from '@mui/material';
import {
  CheckCircle,
  Pending,
  LocalShipping,
  Assignment,
  Verified,
  Security,
  Speed,
  Visibility,
  AccountBalance,
} from '@mui/icons-material';

function BuyerDeals() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active', 'completed', 'all'
  const [offersCount, setOffersCount] = useState(0);

  useEffect(() => {
    if (userProfile?.id) {
      fetchDeals();
      fetchOffersCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id]);

  const fetchOffersCount = async () => {
    try {
      if (!userProfile?.id) return;
      
      let querySnapshot;
      try {
        const q = query(
          collection(db, 'offers'),
          where('buyerId', '==', userProfile.id),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        const q = query(
          collection(db, 'offers'),
          where('buyerId', '==', userProfile.id)
        );
        querySnapshot = await getDocs(q);
      }
      
      setOffersCount(querySnapshot.docs.length);
    } catch (error) {
      console.error('Error fetching offers count:', error);
      setOffersCount(0);
    }
  };

  const fetchDeals = async () => {
    try {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      let querySnapshot;
      try {
        // Try with orderBy first
        const q = query(
          collection(db, 'deals'),
          where('buyerId', '==', userProfile.id),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        // If orderBy fails (likely due to missing index), try without it
        console.warn('orderBy failed for deals, trying without:', error);
        const q = query(
          collection(db, 'deals'),
          where('buyerId', '==', userProfile.id)
        );
        querySnapshot = await getDocs(q);
      }
      
      const dealsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Sort manually if orderBy failed
      dealsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log(`Found ${dealsData.length} deals for buyer ${userProfile.id}`);
      
      setDeals(dealsData);
    } catch (error) {
      console.error('Error fetching deals:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (deal) => {
    const statusConfig = {
      in_progress: { color: 'warning', label: 'In Progress', icon: <Pending /> },
      completed: { color: 'success', label: 'Completed', icon: <CheckCircle /> },
      cancelled: { color: 'error', label: 'Cancelled', icon: <CheckCircle /> },
    };
    const config = statusConfig[deal.status] || statusConfig.in_progress;
    return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
  };

  const filteredDeals = deals.filter(deal => {
    if (filter === 'active') {
      return deal.status === 'in_progress';
    } else if (filter === 'completed') {
      return deal.status === 'completed';
    }
    return true; // 'all'
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const renderSidebar = () => (
    <Box
      sx={{
        width: 280,
        backgroundColor: '#1a237e',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        left: 0,
        top: 0,
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/')}>
          Nimbus
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, px: 2 }}>
            SERVICES
          </Typography>
          <Box sx={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, p: 1 }}>
            <Box
              onClick={() => navigate('/')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 1.5,
                borderRadius: 1,
                backgroundColor: 'rgba(255,255,255,0.2)',
                cursor: 'pointer',
              }}
            >
              <Verified sx={{ mr: 2, fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                AI Hardware Marketplace
              </Typography>
            </Box>
          </Box>
          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Security sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">Browse Listings</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 1,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Speed sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">Make Offers</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, px: 2 }}>
            MY RESOURCES
          </Typography>
          <Box
            onClick={() => navigate('/myoffers')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Visibility sx={{ mr: 2, fontSize: 20 }} />
              <Typography variant="body2">My Offers</Typography>
            </Box>
            {offersCount > 0 && (
              <Badge
                badgeContent={offersCount}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#42a5f5',
                    color: 'white',
                    fontWeight: 600,
                  },
                }}
              />
            )}
          </Box>
          <Box
            onClick={() => navigate('/mydeals')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 1,
              cursor: 'pointer',
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
            }}
          >
            <AccountBalance sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">My Deals</Typography>
          </Box>
          <Box
            onClick={() => navigate('/change-password')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Security sx={{ mr: 2, fontSize: 20 }} />
            <Typography variant="body2">Change Password</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, px: 2 }}>
            EXPLORE
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 1,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Typography variant="body2">Community</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 1,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Typography variant="body2">Documentation</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {renderSidebar()}
      <Box sx={{ flex: 1, marginLeft: '280px', backgroundColor: '#fafafa', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            My Deals
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and track your purchase deals and contracts
          </Typography>
        </Box>

        {/* Filter Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={filter === 'active' ? 0 : filter === 'completed' ? 1 : 2}
            onChange={(e, newValue) => {
              if (newValue === 0) setFilter('active');
              else if (newValue === 1) setFilter('completed');
              else setFilter('all');
            }}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Active (${deals.filter(d => d.status === 'in_progress').length})`} />
            <Tab label={`Completed (${deals.filter(d => d.status === 'completed').length})`} />
            <Tab label={`All (${deals.length})`} />
          </Tabs>
        </Paper>

        {filteredDeals.length > 0 ? (
          <Grid container spacing={3}>
            {filteredDeals.map((deal) => (
              <Grid item xs={12} sm={6} md={4} key={deal.id}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {deal.gpuModel || 'GPU Server'} - {deal.quantity} unit(s)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Deal ID: {deal.id.substring(0, 8)}
                          {deal.contractId && ` • Contract: ${deal.contractId.substring(0, 8)}`}
                        </Typography>
                      </Box>
                      {getStatusChip(deal)}
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Value
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          ${deal.totalValue?.toLocaleString() || '0'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Unit Price
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          ${deal.agreedPrice?.toLocaleString() || '0'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {deal.createdAt?.toDate?.()?.toLocaleDateString() || 'Date not available'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Current Step
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                          {deal.currentStep || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box display="flex" gap={2}>
                      <Button
                        variant="contained"
                        startIcon={<LocalShipping />}
                        onClick={() => navigate(`/deal/${deal.id}`)}
                      >
                        Track Deal
                      </Button>
                      {deal.contractId && (
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/contract/${deal.contractId}`)}
                        >
                          View Contract
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No {filter === 'active' ? 'active' : filter === 'completed' ? 'completed' : ''} deals found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {filter === 'active' 
                ? 'Your active purchases will appear here after signing contracts.'
                : 'Completed deals will appear here.'}
            </Typography>
          </Paper>
        )}
        </Container>
      </Box>
    </Box>
  );
}

export default BuyerDeals;

