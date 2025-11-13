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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  AppBar,
  Toolbar,
  IconButton,
  Pagination,
} from '@mui/material';
import {
  Search,
  FilterList,
  FavoriteBorder,
} from '@mui/icons-material';

function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGpu, setFilterGpu] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Redirect sellers to create listing page
  useEffect(() => {
    if (userProfile && userProfile.userType === 'seller') {
      navigate('/seller/create-listing', { replace: true });
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      let querySnapshot;
      try {
        // Try to order by createdAt with where clauses
        const q = query(
          collection(db, 'listings'),
          where('verified', '==', true),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        // If orderBy fails (missing index), try without orderBy
        console.warn('orderBy failed, trying without:', error);
        const q = query(
          collection(db, 'listings'),
          where('verified', '==', true),
          where('status', '==', 'active')
        );
        querySnapshot = await getDocs(q);
      }

      const listingsData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((l) => {
          // Only show verified, active listings (exclude in_contract and sold)
          return l.verified === true && l.status === 'active';
        })
        // Sort by createdAt or approvedAt if available (newest first)
        .sort((a, b) => {
          const dateA = a.approvedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(a.createdAt || a.submittedAt || 0);
          const dateB = b.approvedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(b.createdAt || b.submittedAt || 0);
          return dateB - dateA; // Newest first
        });
      
      setListings(listingsData);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    // Only filter by search if searchTerm is provided
    const matchesSearch = !searchTerm || 
                         (listing.gpuModel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (listing.chassis || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (listing.sellerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGpu = !filterGpu || listing.gpuModel === filterGpu;
    const matchesCondition = !filterCondition || listing.condition === filterCondition;
    
    return matchesSearch && matchesGpu && matchesCondition;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedListings = filteredListings.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterGpu, filterCondition]);

  const handleMakeOffer = (listingId) => {
    if (userProfile?.userType !== 'buyer') {
      navigate('/login');
      return;
    }
    // Navigate to make offer page
    navigate(`/product/${listingId}/make-offer`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading marketplace...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: 'white', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Nimbus Marketplace
          </Typography>
          <IconButton color="inherit">
            <FilterList />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Search and Filters */}
        <Box mb={4}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by GPU model, chassis, or seller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>GPU Model</InputLabel>
                <Select
                  value={filterGpu}
                  onChange={(e) => setFilterGpu(e.target.value)}
                  label="GPU Model"
                >
                  <MenuItem value="">All GPUs</MenuItem>
                  <MenuItem value="H100">H100</MenuItem>
                  <MenuItem value="H200">H200</MenuItem>
                  <MenuItem value="B200">B200</MenuItem>
                  <MenuItem value="A100">A100</MenuItem>
                  <MenuItem value="V100">V100</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  label="Condition"
                >
                  <MenuItem value="">All Conditions</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="used">Used</MenuItem>
                  <MenuItem value="refurbished">Refurbished</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Listings Grid */}
        <Grid container spacing={3}>
          {paginatedListings.map((listing) => (
            <Grid item xs={12} sm={6} md={4} key={listing.id}>
              <Card 
                onClick={() => navigate(`/product/${listing.id}`)}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  backgroundColor: 'white',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.25s ease',
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2, position: 'relative' }}>
                  {/* Top Right - NVIDIA Badge and Heart */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Chip
                      label="NVIDIA"
                      size="small"
                      sx={{ 
                        backgroundColor: '#66bb6a',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 22,
                        px: 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle favorite toggle
                      }}
                      sx={{
                        backgroundColor: 'white',
                        width: 28,
                        height: 28,
                        border: '1px solid #e0e0e0',
                        p: 0,
                        '&:hover': { 
                          backgroundColor: '#fafafa',
                          borderColor: '#bdbdbd',
                        },
                      }}
                    >
                      <FavoriteBorder sx={{ fontSize: 14, color: '#666' }} />
                    </IconButton>
                  </Box>

                  {/* Top section with GPU name */}
                  <Box sx={{ pr: 8, mb: 2 }}>
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        color: '#212121',
                        mb: 0.5,
                        lineHeight: 1.2,
                      }}
                    >
                      {listing.gpuModel || 'GPU Server'}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.8125rem',
                        color: '#757575',
                      }}
                    >
                      {listing.chassis}
                    </Typography>
                  </Box>
                  
                  {/* Server Type */}
                  <Typography 
                    sx={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: 600,
                      color: '#212121',
                      mb: 0.5,
                      lineHeight: 1.3,
                    }}
                  >
                    {listing.gpuModel || 'GPU'} Server
                  </Typography>

                  {/* Specifications */}
                  <Typography 
                    sx={{ 
                      fontSize: '0.8125rem', 
                      color: '#212121',
                      mb: 1.5,
                      lineHeight: 1.3,
                    }}
                  >
                    {listing.gpuCount ? `${listing.gpuCount}x` : ''} {listing.gpuModel || 'GPU'} {listing.gpuCount && listing.gpuModel ? '•' : ''} {listing.ram ? `${listing.ram}GB RAM` : ''}
                  </Typography>

                  {/* Price */}
                  <Typography 
                    sx={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 700,
                      color: '#212121',
                      mb: 0.5,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2,
                    }}
                  >
                    ${(Math.random() * 50000 + 10000).toLocaleString(undefined, { maximumFractionDigits: 3 })}
                  </Typography>

                  {/* Shipping */}
                  <Typography 
                    sx={{ 
                      fontSize: '0.8125rem', 
                      color: '#4caf50',
                      fontWeight: 400,
                      mb: 0.75,
                      lineHeight: 1.3,
                    }}
                  >
                    Free shipping
                  </Typography>

                  {/* Location */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                    <Box sx={{ fontSize: '0.875rem', color: '#f44336' }}>📍</Box>
                    <Typography 
                      sx={{ 
                        fontSize: '0.8125rem', 
                        color: '#212121',
                        fontWeight: 400,
                      }}
                    >
                      {listing.physicalLocation || 'United States'}
                    </Typography>
                  </Box>

                  {/* Optional Certification */}
                  <Typography 
                    sx={{ 
                      fontSize: '0.75rem', 
                      color: '#9e9e9e',
                      fontWeight: 400,
                      mb: 2,
                    }}
                  >
                    • Certified optional
                  </Typography>
                  
                  {/* Make Offer Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMakeOffer(listing.id);
                    }}
                    disabled={userProfile?.userType !== 'buyer'}
                    sx={{ 
                      py: 1.5,
                      mt: 'auto',
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Make Offer
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredListings.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">
              No listings found matching your criteria
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Try adjusting your search terms or filters
            </Typography>
          </Box>
        )}

        {/* Pagination */}
        {filteredListings.length > itemsPerPage && (
          <Box display="flex" justifyContent="center" mt={4} mb={4}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default Marketplace;
