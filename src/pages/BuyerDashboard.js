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
  ShoppingCart,
  Assignment,
  TrendingUp,
  MoreVert,
  Add,
  Search,
} from '@mui/icons-material';

function BuyerDashboard() {
  const [offers, setOffers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchBuyerData();
  }, []);

  const fetchBuyerData = async () => {
    try {
      // Fetch offers made by this buyer
      const offersQuery = query(
        collection(db, 'offers'),
        where('buyerId', '==', userProfile.id),
        orderBy('createdAt', 'desc')
      );
      const offersSnapshot = await getDocs(offersQuery);
      const offersData = offersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOffers(offersData);

      // Fetch deals involving this buyer
      const dealsQuery = query(
        collection(db, 'deals'),
        where('buyerId', '==', userProfile.id),
        orderBy('createdAt', 'desc')
      );
      const dealsSnapshot = await getDocs(dealsQuery);
      const dealsData = dealsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDeals(dealsData);
    } catch (error) {
      console.error('Error fetching buyer data:', error);
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
            Buyer Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>
            <Search sx={{ mr: 1 }} />
            Browse Marketplace
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
            Welcome back, {userProfile?.fullName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your offers and track your deals
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assignment color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{offers.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Offers
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
                  <ShoppingCart color="success" sx={{ mr: 2 }} />
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
                  <TrendingUp color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {deals.filter(d => d.status === 'completed').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
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
                  <Dashboard color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {deals.filter(d => d.status === 'in_progress').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                  </Box>
                </Box>
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
                        secondary="Start browsing the marketplace to make your first offer"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Deals */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Deals
                </Typography>
                <List>
                  {deals.slice(0, 5).map((deal) => (
                    <React.Fragment key={deal.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${deal.gpuModel} Server`}
                          secondary={`Deal Value: $${deal.totalValue} • Qty: ${deal.quantity}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={deal.status}
                            color={getStatusColor(deal.status)}
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                  {deals.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No deals yet"
                        secondary="Your accepted offers will appear here as deals"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default BuyerDashboard;
