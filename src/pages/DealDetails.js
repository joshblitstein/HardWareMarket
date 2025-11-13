import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Link,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  LocalShipping,
  AccountBalance,
  Verified,
  Schedule,
  LocationOn,
  ArrowBack,
  Lock,
} from '@mui/icons-material';

function DealDetails() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      const docRef = doc(db, 'deals', dealId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setDeal({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('Deal not found');
      }
    } catch (err) {
      console.error('Error fetching deal:', err);
      setError('Failed to load deal details');
    } finally {
      setLoading(false);
    }
  };

  // Mock deal data if not found
  const mockDeal = {
    id: dealId,
    dealNumber: dealId,
    buyerId: 'buyer1',
    buyerName: 'TechCorp AI',
    sellerId: 'seller1',
    sellerName: 'Hardware Solutions Inc',
    listingId: 'listing1',
    gpuModel: 'H100',
    quantity: 2,
    totalValue: 58000,
    agreedPrice: 58000,
    status: 'in_progress',
    currentStep: 'shipment',
    estimatedDelivery: '2024-01-25',
    estimatedDeliveryTime: '5:00 P.M.',
    shipTo: 'San Francisco, CA US',
    complianceStatus: 'approved',
    paymentStatus: 'escrow_funded',
    createdAt: '2024-01-15',
    timeline: [
      {
        status: 'offer_accepted',
        label: 'Offer Accepted',
        location: 'San Francisco, CA',
        date: '01/15/2024',
        time: '2:26 P.M.',
        completed: true,
      },
      {
        status: 'verification',
        label: 'Proof Verified',
        location: 'Nimbus Verification Center',
        date: '01/16/2024',
        time: '10:15 A.M.',
        completed: true,
      },
      {
        status: 'payment',
        label: 'Payment Secured',
        location: 'Escrow Account',
        date: '01/17/2024',
        time: '3:45 P.M.',
        completed: true,
      },
      {
        status: 'preparation',
        label: 'Order Being Prepared',
        location: 'Hardware Solutions Inc',
        date: '01/18/2024',
        time: '9:00 A.M.',
        completed: true,
      },
      {
        status: 'shipment',
        label: 'Out for Delivery',
        location: 'On the Way',
        date: '01/20/2024',
        time: '8:30 A.M.',
        completed: true,
        current: true,
      },
      {
        status: 'delivery',
        label: 'Delivery',
        location: 'San Francisco, CA',
        date: '01/25/2024',
        time: '5:00 P.M.',
        completed: false,
      },
    ],
  };

  const displayDeal = deal || mockDeal;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !displayDeal) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Container>
    );
  }

  const {
    dealNumber = displayDeal.dealNumber,
    estimatedDelivery = displayDeal.estimatedDelivery,
    estimatedDeliveryTime = displayDeal.estimatedDeliveryTime,
    shipTo = displayDeal.shipTo || 'Address not specified',
    timeline = displayDeal.timeline || [],
    status = displayDeal.status,
    totalValue = displayDeal.totalValue,
    gpuModel = displayDeal.gpuModel,
    quantity = displayDeal.quantity,
  } = displayDeal;

  // Update timeline with actual shipTo if available
  const finalTimeline = timeline.map(event => {
    if (event.status === 'delivery') {
      return {
        ...event,
        location: shipTo,
        date: estimatedDelivery ? new Date(estimatedDelivery).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }) : event.date,
        time: estimatedDeliveryTime || event.time,
      };
    }
    return event;
  });

  const getStatusColor = (dealStatus) => {
    const statusMap = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'error',
    };
    return statusMap[dealStatus] || 'info';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    const date = new Date(dateStr);
    return date.toDateString() === today.toDateString();
  };

  const deliveryDate = formatDate(estimatedDelivery);
  const deliveryToday = isToday(estimatedDelivery);

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Track Your Deal
          </Typography>
        </Box>

        <Box display="flex" gap={3} flexDirection={{ xs: 'column', lg: 'row' }}>
          {/* Left Column - Main Tracking Details */}
          <Box sx={{ flex: { xs: 1, lg: '0 0 65%' } }}>
            <Paper elevation={0} sx={{ p: 4, mb: 3, backgroundColor: 'white' }}>
              {/* Deal Information */}
              <Box mb={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Your deal
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  {dealNumber || `Deal #${dealId}`}
                </Typography>

                {/* Estimated Delivery */}
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#00a1b5',
                    mb: 2
                  }}
                >
                  {deliveryToday ? 'Today' : deliveryDate}
                  {estimatedDeliveryTime && ` by ${estimatedDeliveryTime}`}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Not going to be available? Check your delivery options.{' '}
                  <Link href="#" sx={{ textDecoration: 'none' }}>
                    Click here
                  </Link>
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Ship To */}
              <Box mb={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Ship To
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {shipTo}
                </Typography>
              </Box>

              {/* Tracking Timeline */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Deal Progress
                </Typography>

                {finalTimeline.map((event, index) => {
                  const isLast = index === finalTimeline.length - 1;
                  const isCurrent = event.current;
                  const isCompleted = event.completed;

                  return (
                    <Box key={index} sx={{ position: 'relative', mb: isLast ? 0 : 4 }}>
                      {/* Timeline Line */}
                      {!isLast && (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 20,
                            top: 40,
                            bottom: -16,
                            width: 2,
                            backgroundColor: isCompleted ? '#2e7d32' : '#e0e0e0',
                            zIndex: 0,
                          }}
                        />
                      )}

                      {/* Event Content */}
                      <Box display="flex" gap={2}>
                        {/* Icon */}
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: isCompleted 
                              ? '#2e7d32' 
                              : isCurrent 
                              ? '#1976d2' 
                              : 'white',
                            border: `2px solid ${isCompleted ? '#2e7d32' : isCurrent ? '#1976d2' : '#e0e0e0'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                            position: 'relative',
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle sx={{ color: 'white', fontSize: 24 }} />
                          ) : isCurrent ? (
                            <LocalShipping sx={{ color: 'white', fontSize: 24 }} />
                          ) : (
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: '#e0e0e0',
                              }}
                            />
                          )}
                        </Box>

                        {/* Event Details */}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: isCurrent ? 600 : 500, mb: 0.5 }}>
                            {event.label}
                          </Typography>
                          {event.location && (
                            <Typography variant="body2" color="text.secondary">
                              {event.location}
                            </Typography>
                          )}
                          {(event.date || event.time) && (
                            <Typography variant="body2" color="text.secondary">
                              {event.date && `${event.date}${event.time ? ', ' : ''}`}
                              {event.time}
            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Link href="#" sx={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                View All Deal Details
                <Typography component="span">→</Typography>
              </Link>
            </Paper>
          </Box>

          {/* Right Column - Cards */}
          <Box sx={{ flex: { xs: 1, lg: '0 0 32%' } }}>
            {/* Delivery Alerts Card */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Set delivery alerts for your deal
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Receive notifications about your deal status, payment updates, and delivery information.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: '#ed6c02',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    mb: 1,
                    '&:hover': {
                      backgroundColor: '#d84315',
                    },
                  }}
                >
                  Sign up →
                </Button>
                <Link href="#" sx={{ textDecoration: 'none', fontSize: '0.875rem' }}>
                  Already enrolled? Log in
                </Link>
              </CardContent>
            </Card>

            {/* Track Another Deal Card */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Track Another Deal
          </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter deal ID"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    if (trackingNumber) {
                      navigate(`/deal/${trackingNumber}`);
                      setTrackingNumber('');
                    }
                  }}
                  sx={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Track
                </Button>
              </CardContent>
            </Card>

            {/* Security Card */}
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" gap={2} mb={1}>
                  <Lock sx={{ color: '#1976d2', fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Stay Safe - Avoid Fraud and Scams
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Received a text, call, or email that seems suspicious? Don't respond to it.
          </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  Tips to Avoid Fraud
                </Button>
        </CardContent>
      </Card>
          </Box>
        </Box>
    </Container>
    </Box>
  );
}

export default DealDetails;
