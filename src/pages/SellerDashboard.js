import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  Inventory,
  Assignment,
  TrendingUp,
  MoreVert,
  Add,
  Visibility,
} from '@mui/icons-material';

function SellerDashboard() {
  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      // Fetch listings created by this seller
      const listingsQuery = query(
        collection(db, 'listings'),
        where('sellerId', '==', userProfile.id),
        orderBy('createdAt', 'desc')
      );
      const listingsSnapshot = await getDocs(listingsQuery);
      const listingsData = listingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setListings(listingsData);

      // Fetch offers received for this seller's listings
      const offersQuery = query(
        collection(db, 'offers'),
        where('sellerId', '==', userProfile.id),
        orderBy('createdAt', 'desc')
      );
      const offersSnapshot = await getDocs(offersQuery);
      const offersData = offersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOffers(offersData);

      // Fetch deals involving this seller
      const dealsQuery = query(
        collection(db, 'deals'),
        where('sellerId', '==', userProfile.id),
        orderBy('createdAt', 'desc')
      );
      const dealsSnapshot = await getDocs(dealsQuery);
      const dealsData = dealsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDeals(dealsData);
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_verification': return 'warning';
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Seller Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate('/seller/create-listing')}>
            <Add sx={{ mr: 1 }} />
            Create Listing
          </Button>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {userProfile?.companyName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your listings and track your sales
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Inventory color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{listings.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Listings
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assignment color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{offers.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Offers
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{deals.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Deals
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Dashboard color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {listings.filter(l => l.verified && l.status === 'active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Listings
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Listings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Listings
                </Typography>
                <List>
                  {listings.slice(0, 5).map((listing) => (
                    <React.Fragment key={listing.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${listing.gpuModel} Server`}
                          secondary={`${listing.chassis} • ${listing.gpuCount} GPUs • Qty: ${listing.quantity}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={listing.status}
                            color={getStatusColor(listing.status)}
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                  {listings.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No listings yet"
                        secondary="Create your first listing to start selling"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Offers */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Offers
                </Typography>
                <List>
                  {offers.slice(0, 5).map((offer) => (
                    <React.Fragment key={offer.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${offer.gpuModel} Server`}
                          secondary={`Offer: $${offer.offerPrice} • Qty: ${offer.quantity}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={offer.status}
                            color={getStatusColor(offer.status)}
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                  {offers.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No offers yet"
                        secondary="Offers for your listings will appear here"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/seller/create-listing')}
                  >
                    Create New Listing
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => navigate('/')}
                  >
                    View Marketplace
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default SellerDashboard;
