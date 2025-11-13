import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import { generateContractTemplate } from '../utils/contractTemplate';
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
  Tab,
  Tabs,
  Paper,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  AttachMoney,
  CheckCircle,
  Close,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function SellerOffers() {
  const [tabValue, setTabValue] = useState(0);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  useEffect(() => {
    if (userProfile?.id) {
      fetchOffers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id]);

  const fetchOffers = async () => {
    try {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Try with orderBy first, fallback to without if it fails (for unindexed fields)
      let querySnapshot;
      try {
        const q = query(
          collection(db, 'offers'),
          where('sellerId', '==', userProfile.id),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        // If orderBy fails (likely due to missing index), try without it
        console.warn('orderBy failed, trying without:', error);
        const q = query(
          collection(db, 'offers'),
          where('sellerId', '==', userProfile.id)
        );
        querySnapshot = await getDocs(q);
      }

      const offersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort manually if orderBy failed
      offersData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setOffers(offersData);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]); // Set empty array on error instead of using mock data
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleActionClick = (offer, type) => {
    setSelectedOffer(offer);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const handleActionConfirm = async () => {
    try {
      if (!selectedOffer) return;

      const offerRef = doc(db, 'offers', selectedOffer.id);
      let contractId = null; // Declare outside if block for navigation
      
      if (actionType === 'accept') {
        // Update offer status to accepted
        await updateDoc(offerRef, {
          status: 'accepted',
          acceptedAt: new Date(),
        });

        // Get listing details for contract
        let listingData = null;
        if (selectedOffer.listingId) {
          try {
            const listingRef = doc(db, 'listings', selectedOffer.listingId);
            const listingSnap = await getDoc(listingRef);
            if (listingSnap.exists()) {
              listingData = listingSnap.data();
            }
          } catch (listingError) {
            console.error('Error fetching listing for contract:', listingError);
          }
        }

        // Get buyer details for contract
        let buyerData = null;
        try {
          const buyerRef = doc(db, 'users', selectedOffer.buyerId);
          const buyerSnap = await getDoc(buyerRef);
          if (buyerSnap.exists()) {
            buyerData = buyerSnap.data();
          }
        } catch (buyerError) {
          console.error('Error fetching buyer for contract:', buyerError);
        }

        // Create contract from the accepted offer
        try {
          const contractTemplate = generateContractTemplate({
            buyerName: selectedOffer.buyerName || buyerData?.fullName || buyerData?.companyName || 'Buyer',
            buyerEmail: selectedOffer.buyerEmail || buyerData?.email || '',
            sellerName: selectedOffer.sellerName || userProfile?.fullName || userProfile?.companyName || 'Seller',
            sellerCompany: userProfile?.companyName || '',
            productName: listingData?.gpuModel ? `${listingData.gpuModel} Server` : 'GPU Server',
            gpuModel: selectedOffer.gpuModel || listingData?.gpuModel || 'N/A',
            quantity: selectedOffer.quantity || 1,
            unitPrice: selectedOffer.offerPrice,
            totalPrice: selectedOffer.offerPrice * (selectedOffer.quantity || 1),
            location: listingData?.physicalLocation || 'Not specified',
            listingDetails: listingData ? `Chassis: ${listingData.chassis || 'N/A'}, RAM: ${listingData.ram || 'N/A'}GB` : ''
          });

          const contractRef = await addDoc(collection(db, 'contracts'), {
            listingId: selectedOffer.listingId,
            sellerId: userProfile.id,
            sellerName: selectedOffer.sellerName || userProfile?.fullName || userProfile?.companyName || 'Seller',
            buyerId: selectedOffer.buyerId,
            buyerName: selectedOffer.buyerName || buyerData?.fullName || buyerData?.companyName || 'Buyer',
            buyerEmail: selectedOffer.buyerEmail || buyerData?.email || '',
            contractTemplate: contractTemplate,
            quantity: selectedOffer.quantity || 1,
            agreedPrice: selectedOffer.offerPrice,
            totalValue: selectedOffer.offerPrice * (selectedOffer.quantity || 1),
            status: 'pending_buyer_signature',
            offerId: selectedOffer.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          contractId = contractRef.id;
          console.log('✅ Contract created from offer:', contractId);
        } catch (contractError) {
          console.error('Error creating contract:', contractError);
        }

        // Create a deal from the accepted offer
        let dealId = null;
        try {
          const dealRef = await addDoc(collection(db, 'deals'), {
            buyerId: selectedOffer.buyerId,
            sellerId: userProfile.id,
            listingId: selectedOffer.listingId,
            offerId: selectedOffer.id,
            contractId: contractId,
            gpuModel: selectedOffer.gpuModel,
            quantity: selectedOffer.quantity,
            agreedPrice: selectedOffer.offerPrice,
            totalValue: selectedOffer.offerPrice * (selectedOffer.quantity || 1),
            status: 'in_progress',
            currentStep: 'payment',
            complianceStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          dealId = dealRef.id;
        } catch (dealError) {
          console.error('Error creating deal:', dealError);
          // Still update the offer status even if deal creation fails
        }

        // Update listing status to 'in_contract' to hide it from marketplace
        // Also update quantity if partial sale
        if (selectedOffer.listingId) {
          try {
            const listingRef = doc(db, 'listings', selectedOffer.listingId);
            const listingSnap = await getDoc(listingRef);
            
            if (listingSnap.exists()) {
              const listingData = listingSnap.data();
              const remainingQuantity = (listingData.quantity || 0) - (selectedOffer.quantity || 1);
              
              if (remainingQuantity <= 0) {
                // All units sold, mark listing as sold
                await updateDoc(listingRef, {
                  status: 'sold',
                  soldAt: new Date(),
                  dealId: dealId,
                  contractId: contractId,
                  quantity: 0,
                  updatedAt: new Date(),
                });
              } else {
                // Update remaining quantity and mark as in_contract
                await updateDoc(listingRef, {
                  status: 'in_contract',
                  quantity: remainingQuantity,
                  contractId: contractId,
                  updatedAt: new Date(),
                });
              }
            }
          } catch (listingError) {
            console.error('Error updating listing:', listingError);
            // Don't throw - deal is created, listing update failure is not critical
          }
        }
      } else if (actionType === 'reject') {
        // Update offer status to rejected
        await updateDoc(offerRef, {
          status: 'rejected',
          rejectedAt: new Date(),
        });
      }

      setActionDialogOpen(false);
      setSelectedOffer(null);
      
      // If offer was accepted, navigate to contract page
      if (actionType === 'accept' && contractId) {
        navigate(`/seller/contracts/${contractId}`);
      } else {
        // Refresh offers for other actions
        await fetchOffers();
      }
    } catch (error) {
      console.error(`Error ${actionType}ing offer:`, error);
      alert(`Failed to ${actionType} offer. Please try again.`);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', label: 'Pending' },
      accepted: { color: 'success', label: 'Accepted' },
      rejected: { color: 'error', label: 'Rejected' },
      expired: { color: 'default', label: 'Expired' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  // Filter offers by status - using actual database data only
  const displayPending = offers.filter(o => o.status === 'pending');
  const displayAccepted = offers.filter(o => o.status === 'accepted');
  const displayRejected = offers.filter(o => o.status === 'rejected');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading offers...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={4}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Manage Offers
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and respond to buyer offers on your listings
            </Typography>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <AttachMoney sx={{ fontSize: 40, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Pending Offers
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {displayPending.length}
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
                      {displayAccepted.length}
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
                      {displayRejected.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Pending (${displayPending.length})`} />
            <Tab label={`Accepted (${displayAccepted.length})`} />
            <Tab label={`Rejected (${displayRejected.length})`} />
          </Tabs>
        </Paper>

        {/* Pending Offers Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {displayPending.map((offer) => {
              const priceDiff = offer.offerPrice - (offer.listingPrice || offer.offerPrice);
              const priceDiffPercent = offer.listingPrice
                ? ((priceDiff / offer.listingPrice) * 100).toFixed(1)
                : 0;
              const isDiscount = priceDiff < 0;

              return (
                <Grid item xs={12} key={offer.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {offer.gpuModel || 'GPU Server'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Offer ID: {offer.id}
                          </Typography>
                        </Box>
                        {getStatusChip(offer.status)}
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Buyer
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {offer.buyerName || 'Unknown Buyer'}
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
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              ${offer.offerPrice?.toLocaleString()}
                            </Typography>
                            {offer.listingPrice && (
                              <>
                                {isDiscount ? (
                                  <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
                                ) : (
                                  <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                                )}
                                <Typography variant="body2" color={isDiscount ? 'error.main' : 'success.main'}>
                                  {isDiscount ? '' : '+'}
                                  {priceDiffPercent}%
                                </Typography>
                              </>
                            )}
                          </Box>
                          {offer.listingPrice && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Listed at: ${offer.listingPrice.toLocaleString()}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Target Delivery
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {offer.targetDeliveryWindow || 'Not specified'}
                          </Typography>
                        </Grid>
                        {offer.notes && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Buyer Notes
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              "{offer.notes}"
                            </Typography>
                          </Grid>
                        )}
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Created
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {offer.createdAt?.toDate?.()?.toLocaleDateString() || 
                             (offer.createdAt ? new Date(offer.createdAt.seconds * 1000).toLocaleDateString() : 'Date not available')}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box display="flex" gap={2} flexWrap="wrap">
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleActionClick(offer, 'accept')}
                        >
                          Accept Offer
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleActionClick(offer, 'reject')}
                        >
                          Reject Offer
                        </Button>
                        <Button variant="outlined" onClick={() => navigate(`/product/${offer.listingId}`)}>
                          View Listing
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}

            {displayPending.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                  <AttachMoney sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No pending offers
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Buyer offers on your listings will appear here
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Accepted Offers Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {displayAccepted.map((offer) => (
              <Grid item xs={12} key={offer.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {offer.gpuModel || 'GPU Server'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Offer ID: {offer.id}
                        </Typography>
                      </Box>
                      {getStatusChip(offer.status)}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Buyer
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {offer.buyerName || 'Unknown Buyer'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Offer Price
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                          ${offer.offerPrice?.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Accepted
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {offer.acceptedAt?.toDate?.()?.toLocaleDateString() || 
                           (offer.acceptedAt ? new Date(offer.acceptedAt.seconds * 1000).toLocaleDateString() : 
                            offer.createdAt?.toDate?.()?.toLocaleDateString() || 
                            (offer.createdAt ? new Date(offer.createdAt.seconds * 1000).toLocaleDateString() : 'Date not available'))}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box mt={2}>
                      <Button variant="outlined" onClick={() => navigate(`/deal/${offer.id}`)}>
                        View Deal Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {displayAccepted.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No accepted offers
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Accepted offers will appear here
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Rejected Offers Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {displayRejected.map((offer) => (
              <Grid item xs={12} key={offer.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {offer.gpuModel || 'GPU Server'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Offer ID: {offer.id}
                        </Typography>
                      </Box>
                      {getStatusChip(offer.status)}
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Buyer
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {offer.buyerName || 'Unknown Buyer'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Offer Price
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          ${offer.offerPrice?.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {displayRejected.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 8, textAlign: 'center' }}>
                  <Close sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No rejected offers
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Rejected offers will appear here
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>
      </Container>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)}>
        <DialogTitle>
          {actionType === 'accept' ? 'Accept Offer' : 'Reject Offer'}
        </DialogTitle>
        <DialogContent>
          {selectedOffer && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to {actionType} this offer from{' '}
                <strong>{selectedOffer.buyerName || 'Buyer'}</strong> for{' '}
                <strong>${selectedOffer.offerPrice?.toLocaleString()}</strong>?
              </Typography>
              {actionType === 'accept' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Accepting this offer will create a deal and move the process to payment and shipping.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleActionConfirm}
            variant="contained"
            color={actionType === 'accept' ? 'success' : 'error'}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SellerOffers;

