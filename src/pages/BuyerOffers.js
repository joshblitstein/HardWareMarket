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
  AttachMoney,
  CheckCircle,
  Close,
  Pending,
  Description,
  Assignment,
  Verified,
  Security,
  Speed,
  Visibility,
  AccountBalance,
} from '@mui/icons-material';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function BuyerOffers() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [offers, setOffers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // 0: offers, 1: contracts
  const [offersCount, setOffersCount] = useState(0);

  useEffect(() => {
    if (userProfile?.id) {
      fetchData();
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

  const fetchData = async () => {
    try {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fetch offers made by this buyer
      let offersQuerySnapshot;
      try {
        const offersQuery = query(
          collection(db, 'offers'),
          where('buyerId', '==', userProfile.id),
          orderBy('createdAt', 'desc')
        );
        offersQuerySnapshot = await getDocs(offersQuery);
      } catch (error) {
        console.warn('orderBy failed for offers, trying without:', error);
        const offersQuery = query(
          collection(db, 'offers'),
          where('buyerId', '==', userProfile.id)
        );
        offersQuerySnapshot = await getDocs(offersQuery);
      }

      const offersData = offersQuerySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      offersData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setOffers(offersData);

      // Fetch contracts for this buyer (from accepted offers)
      let contractsQuerySnapshot;
      try {
        const contractsQuery = query(
          collection(db, 'contracts'),
          where('buyerId', '==', userProfile.id),
          orderBy('createdAt', 'desc')
        );
        contractsQuerySnapshot = await getDocs(contractsQuery);
      } catch (error) {
        console.warn('orderBy failed for contracts, trying without:', error);
        const contractsQuery = query(
          collection(db, 'contracts'),
          where('buyerId', '==', userProfile.id)
        );
        contractsQuerySnapshot = await getDocs(contractsQuery);
      }

      const contractsData = contractsQuerySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      contractsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setContracts(contractsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setOffers([]);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const getOfferStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending', icon: <Pending /> },
      accepted: { color: 'success', label: 'Accepted', icon: <CheckCircle /> },
      rejected: { color: 'error', label: 'Rejected', icon: <Close /> },
      expired: { color: 'default', label: 'Expired', icon: <Pending /> },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Chip label={config.label} color={config.color} size="small" icon={config.icon} />;
  };

  const getContractStatusChip = (contract) => {
    const { buyerSignature, sellerSignature } = contract;
    
    if (sellerSignature) {
      return <Chip label="Completed" color="success" size="small" icon={<CheckCircle />} />;
    } else if (buyerSignature) {
      return <Chip label="Pending Seller Signature" color="warning" size="small" icon={<Pending />} />;
    } else {
      return <Chip label="Pending Your Signature" color="default" size="small" icon={<Pending />} />;
    }
  };

  const pendingOffers = offers.filter(o => o.status === 'pending');
  const acceptedOffers = offers.filter(o => o.status === 'accepted');
  const rejectedOffers = offers.filter(o => o.status === 'rejected');

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
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
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
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
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
            My Offers & Contracts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your offers and manage contracts from accepted offers
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              label={`Offers (${offers.length})`}
              icon={<AttachMoney />}
              iconPosition="start"
            />
            <Tab 
              label={`Contracts (${contracts.length})`}
              icon={<Description />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Offers Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Pending sx={{ fontSize: 40, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pending Offers
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {pendingOffers.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Accepted Offers
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {acceptedOffers.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Close sx={{ fontSize: 40, color: 'error.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Rejected Offers
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {rejectedOffers.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Offers List */}
          <Grid container spacing={3}>
            {offers.length > 0 ? (
              offers.map((offer) => (
                <Grid item xs={12} key={offer.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {offer.gpuModel || 'GPU Server'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Offer ID: {offer.id.substring(0, 8)}...
                          </Typography>
                        </Box>
                        {getOfferStatusChip(offer.status)}
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Seller
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {offer.sellerName || 'Unknown Seller'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Quantity
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {offer.quantity || 1} units
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Offer Price
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            ${offer.offerPrice?.toLocaleString()}
                          </Typography>
                          {offer.listingPrice && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Listed at: ${offer.listingPrice.toLocaleString()}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Created
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {offer.createdAt?.toDate?.()?.toLocaleDateString() || 
                             (offer.createdAt ? new Date(offer.createdAt.seconds * 1000).toLocaleDateString() : 'Date not available')}
                          </Typography>
                        </Grid>
                        {offer.notes && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Your Notes
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              "{offer.notes}"
                            </Typography>
                          </Grid>
                        )}
                      </Grid>

                      <Box display="flex" gap={2} flexWrap="wrap">
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/product/${offer.listingId}`)}
                        >
                          View Listing
                        </Button>
                        {offer.status === 'accepted' && (
                          <Button
                            variant="contained"
                            startIcon={<Description />}
                            onClick={() => {
                              // Find contract for this offer
                              const contract = contracts.find(c => c.offerId === offer.id);
                              if (contract) {
                                navigate(`/contract/${contract.id}`);
                              }
                            }}
                          >
                            View Contract
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                  <AttachMoney sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No offers yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Your offers on listings will appear here
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Contracts Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {contracts.length > 0 ? (
              contracts.map((contract) => (
                <Grid item xs={12} key={contract.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Contract #{contract.id.substring(0, 8)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Created: {contract.createdAt?.toDate?.()?.toLocaleDateString() || 
                                     (contract.createdAt ? new Date(contract.createdAt.seconds * 1000).toLocaleDateString() : 'Date not available')}
                          </Typography>
                        </Box>
                        {getContractStatusChip(contract)}
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Seller
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {contract.sellerName || 'Unknown Seller'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Total Value
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            ${contract.totalValue?.toLocaleString() || '0'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Quantity
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {contract.quantity || 1} units
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Unit Price
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            ${contract.agreedPrice?.toLocaleString() || '0'}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box display="flex" gap={2} flexWrap="wrap">
                        <Button
                          variant="contained"
                          startIcon={<Description />}
                          onClick={() => navigate(`/contract/${contract.id}`)}
                          disabled={!!contract.sellerSignature}
                        >
                          {contract.buyerSignature && !contract.sellerSignature 
                            ? 'View Contract (Waiting for Seller)' 
                            : !contract.buyerSignature 
                            ? 'Sign Contract' 
                            : 'View Contract'}
                        </Button>
                        {contract.listingId && (
                          <Button
                            variant="outlined"
                            onClick={() => navigate(`/product/${contract.listingId}`)}
                          >
                            View Listing
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                  <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No contracts yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Contracts from accepted offers will appear here
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        </Container>
      </Box>
    </Box>
  );
}

export default BuyerOffers;

