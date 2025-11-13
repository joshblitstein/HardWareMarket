import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  IconButton,
  TextField,
  Divider,
  Link,
} from '@mui/material';
import {
  ArrowBack,
  Assignment,
  CheckCircle,
  LocalShipping,
  Lock,
  LocationOn,
} from '@mui/icons-material';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function SellerOrders() {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Mock order data with timeline
  const activeOrders = [
    {
      id: 'ORD-001',
      dealNumber: 'DEAL-001',
      listingTitle: 'H100 Server - 8x GPUs',
      buyer: 'TechCorp AI',
      buyerLocation: 'San Francisco, CA US',
      quantity: 2,
      totalValue: 58000,
      status: 'in_progress',
      createdAt: '2024-01-15',
      estimatedDelivery: '2024-01-25',
      estimatedDeliveryTime: '5:00 P.M.',
      paymentStatus: 'escrow_funded',
      deliveryStatus: 'shipment',
      timeline: [
        {
          status: 'offer_accepted',
          label: 'Offer Accepted',
          location: 'TechCorp AI',
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
    },
    {
      id: 'ORD-002',
      dealNumber: 'DEAL-002',
      listingTitle: 'A100 80G Server',
      buyer: 'DataCenter Pro',
      buyerLocation: 'Toronto, ON CA',
      quantity: 1,
      totalValue: 32000,
      status: 'in_progress',
      createdAt: '2024-01-20',
      estimatedDelivery: '2024-01-28',
      estimatedDeliveryTime: '3:00 P.M.',
      paymentStatus: 'escrow_funded',
      deliveryStatus: 'preparation',
      timeline: [
        {
          status: 'offer_accepted',
          label: 'Offer Accepted',
          location: 'DataCenter Pro',
          date: '01/20/2024',
          time: '11:15 A.M.',
          completed: true,
        },
        {
          status: 'verification',
          label: 'Proof Verified',
          location: 'Nimbus Verification Center',
          date: '01/21/2024',
          time: '2:00 P.M.',
          completed: true,
        },
        {
          status: 'payment',
          label: 'Payment Secured',
          location: 'Escrow Account',
          date: '01/22/2024',
          time: '9:30 A.M.',
          completed: true,
        },
        {
          status: 'preparation',
          label: 'Order Being Prepared',
          location: 'Hardware Solutions Inc',
          date: '01/23/2024',
          time: '10:00 A.M.',
          completed: true,
          current: true,
        },
        {
          status: 'shipment',
          label: 'Out for Delivery',
          location: 'On the Way',
          date: '01/26/2024',
          time: '8:00 A.M.',
          completed: false,
        },
        {
          status: 'delivery',
          label: 'Delivery',
          location: 'Toronto, ON',
          date: '01/28/2024',
          time: '3:00 P.M.',
          completed: false,
        },
      ],
    },
  ];

  const completedOrders = [
    {
      id: 'ORD-003',
      dealNumber: 'DEAL-003',
      listingTitle: 'H200 Server - 4x GPUs',
      buyer: 'Compute Dynamics',
      buyerLocation: 'London, UK',
      quantity: 1,
      totalValue: 45000,
      status: 'completed',
      completedAt: '2024-01-10',
      timeline: [
        { status: 'offer_accepted', label: 'Offer Accepted', completed: true },
        { status: 'verification', label: 'Proof Verified', completed: true },
        { status: 'payment', label: 'Payment Secured', completed: true },
        { status: 'preparation', label: 'Order Prepared', completed: true },
        { status: 'shipment', label: 'Shipped', completed: true },
        { status: 'delivery', label: 'Delivered', completed: true },
      ],
    },
  ];

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

  const renderOrderTracking = (order) => {
    const deliveryDate = formatDate(order.estimatedDelivery || order.completedAt);
    const deliveryToday = order.estimatedDelivery ? isToday(order.estimatedDelivery) : false;

    return (
      <Box key={order.id} mb={4}>
        <Box display="flex" gap={3} flexDirection={{ xs: 'column', lg: 'row' }}>
          {/* Left Column - Main Tracking Details */}
          <Box sx={{ flex: { xs: 1, lg: '0 0 65%' } }}>
            <Paper elevation={0} sx={{ p: 4, backgroundColor: 'white' }}>
              {/* Order Information */}
              <Box mb={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Your order
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                  {order.dealNumber || order.id}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  {order.listingTitle}
                </Typography>

                {/* Estimated Delivery (only for active orders) */}
                {order.status !== 'completed' && order.estimatedDelivery && (
                  <>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: '#00a1b5',
                        mb: 2,
                      }}
                    >
                      {deliveryToday ? 'Today' : deliveryDate}
                      {order.estimatedDeliveryTime && ` by ${order.estimatedDeliveryTime}`}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Need to update delivery details?{' '}
                      <Link href="#" sx={{ textDecoration: 'none' }}>
                        Click here
                      </Link>
                    </Typography>
                  </>
                )}

                {order.status === 'completed' && (
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#2e7d32', mb: 2 }}>
                    ✓ Delivered on {deliveryDate}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Ship To */}
              <Box mb={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Ship To
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {order.buyerLocation || order.buyer}
                </Typography>
              </Box>

              {/* Tracking Timeline */}
              {order.timeline && order.timeline.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Order Progress
                  </Typography>

                  {order.timeline.map((event, index) => {
                    const isLast = index === order.timeline.length - 1;
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
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: isCurrent ? 600 : 500, mb: 0.5 }}
                            >
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
              )}

              <Divider sx={{ my: 3 }} />

              {/* Order Details */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Buyer
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                  {order.buyer}
                </Typography>

                <Box display="flex" gap={3} mb={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Quantity
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {order.quantity} units
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Value
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      ${order.totalValue.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button variant="contained" startIcon={<LocalShipping />}>
                    Update Shipping
                  </Button>
                  <Button variant="outlined" onClick={() => navigate(`/deal/${order.dealNumber || order.id}`)}>
                    View Full Details
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Right Column - Action Cards */}
          <Box sx={{ flex: { xs: 1, lg: '0 0 32%' } }}>
            {/* Delivery Alerts Card */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Set delivery alerts for your order
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Receive notifications about order status, payment updates, and delivery information.
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

            {/* Track Another Order Card */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Track Another Order
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter order ID"
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
                      Received a suspicious message? Don't respond to it.
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
      </Box>
    );
  };

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Track Order Progress
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your sales and monitor order status
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Active Orders (${activeOrders.length})`} />
            <Tab label={`Completed Orders (${completedOrders.length})`} />
          </Tabs>
        </Paper>

        {/* Active Orders Tab */}
        <TabPanel value={tabValue} index={0}>
          {activeOrders.length > 0 ? (
            activeOrders.map((order) => renderOrderTracking(order))
          ) : (
            <Paper sx={{ p: 8, textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No active orders
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Your accepted offers will appear here
              </Typography>
            </Paper>
          )}
        </TabPanel>

        {/* Completed Orders Tab */}
        <TabPanel value={tabValue} index={1}>
          {completedOrders.length > 0 ? (
            completedOrders.map((order) => renderOrderTracking(order))
          ) : (
            <Paper sx={{ p: 8, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No completed orders yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Completed orders will appear here
              </Typography>
            </Paper>
          )}
        </TabPanel>
      </Container>
    </Box>
  );
}

export default SellerOrders;
