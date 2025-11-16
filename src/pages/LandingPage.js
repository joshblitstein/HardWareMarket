import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Badge } from '@mui/material';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
  Paper,
  CircularProgress,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Pagination,
  Menu,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Verified,
  Security,
  Speed,
  Visibility,
  AccountBalance,
  Rocket,
  Search,
  FavoriteBorder,
  ArrowDropDown,
} from '@mui/icons-material';

function LandingPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();


  // ---------- Redirect sellers to create listing page ----------
  useEffect(() => {
    if (userProfile && userProfile.userType === 'seller') {
      navigate('/seller/create-listing', { replace: true });
    }
  }, [userProfile, navigate]);

  // ---------- Sizing constants used everywhere ----------
  const CARD_W = 320; // Main listing card width
  const CARD_H = 340; // Main listing card height (no image section)
  
  // Featured card sizes
  const FEATURED_CARD_W = 280;
  const FEATURED_CARD_H = 320; // No image section

  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const [offersCount, setOffersCount] = useState(0);
  const [filters, setFilters] = useState({
    gpuModel: '',
    condition: '',
    location: '',
    seller: '',
    searchTerm: '',
  });
  const [filterMenuAnchor, setFilterMenuAnchor] = useState({
    gpu: null,
    condition: null,
    location: null,
  });

  useEffect(() => {
    fetchListings();
    if (userProfile?.id) {
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
        // Fallback without orderBy
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

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, filters]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const applyFilters = () => {
    let filtered = [...listings];

    if (filters.gpuModel) {
      filtered = filtered.filter((l) => l.gpuModel === filters.gpuModel);
    }
    if (filters.condition) {
      filtered = filtered.filter((l) => l.condition === filters.condition);
    }
    if (filters.location) {
      filtered = filtered.filter((l) =>
        (l.physicalLocation || '').toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.seller) {
      filtered = filtered.filter((l) =>
        (l.sellerName || '').toLowerCase().includes(filters.seller.toLowerCase())
      );
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.gpuModel || '').toLowerCase().includes(term) ||
          (l.chassis || '').toLowerCase().includes(term) ||
          (l.sellerName || '').toLowerCase().includes(term)
      );
    }

    setFilteredListings(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      gpuModel: '',
      condition: '',
      location: '',
      seller: '',
      searchTerm: '',
    });
  };

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
        try {
          const q = query(
            collection(db, 'listings'),
            where('verified', '==', true),
            where('status', '==', 'active')
          );
          querySnapshot = await getDocs(q);
        } catch {
          // Fallback: get all and filter client-side
          const simpleQ = query(collection(db, 'listings'));
          querySnapshot = await getDocs(simpleQ);
        }
      }

      const listingsData = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
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


  // ---------- Main Listing Card Component (Chrono24 style) ----------
  function ListingCard({ listing }) {
    // Determine badge type randomly for demo
    const badgeType = Math.random();
    const hasBadge = badgeType < 0.7; // 70% chance of having a badge
    const badgeText = badgeType < 0.35 ? 'PROMOTED' : badgeType < 0.7 ? 'POPULAR' : '';
    const isPromoted = badgeText === 'PROMOTED';
    
    return (
      <Box sx={{ width: CARD_W }}>
        <Card
          onClick={() => navigate(`/product/${listing.id}`)}
          sx={{
            height: CARD_H,
            position: 'relative',
            cursor: 'pointer',
            border: 'none',
            '&:hover': { 
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)', 
              transform: 'translateY(-2px)', 
              transition: 'all 0.25s ease',
            },
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {/* Badge (top-left) - POPULAR/PROMOTED */}
          {hasBadge && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 3,
                backgroundColor: isPromoted ? '#f5f5f5' : '#424242',
                color: isPromoted ? '#212121' : '#ffffff',
                px: 1.5,
                py: 0.5,
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {badgeText}
            </Box>
          )}

          {/* Top Right Section - NVIDIA Badge and Heart */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Chip
              label="NVIDIA"
              size="small"
              sx={{ 
                backgroundColor: '#8547B7',
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

          {/* Content Section */}
          <Box sx={{ px: 2, pt: { xs: 4, sm: 4.5 }, pb: 1, flex: '0 0 auto' }}>
            {/* Product Name */}
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

            {/* Subtitle/Chassis */}
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.8125rem',
                color: '#757575',
                mb: 0.75,
                lineHeight: 1.3,
              }}
            >
              {listing.chassis}
            </Typography>

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

            {/* Configuration/Specs */}
            <Box sx={{ mb: 0.75 }}>
              <Typography 
                sx={{ 
                  fontSize: '0.8125rem', 
                  color: '#212121',
                  mb: 0.4,
                  lineHeight: 1.3,
                }}
              >
                {listing.gpuCount ? `${listing.gpuCount}x` : ''} {listing.gpuModel || 'GPU'} {listing.gpuCount && listing.gpuModel ? '•' : ''} {listing.ram ? `${listing.ram}GB RAM` : ''}
              </Typography>
              {listing.cpuModel && (
                <Typography 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: '#757575',
                    mb: 0.4,
                    lineHeight: 1.3,
                  }}
                >
                  {listing.cpuCount ? `${listing.cpuCount}x` : ''} {listing.cpuModel} {listing.cpuCount ? 'CPU' : ''}
                </Typography>
              )}
              {listing.storage && (
                <Typography 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: '#757575',
                    mb: 0.4,
                    lineHeight: 1.3,
                  }}
                >
                  {listing.storage}
                </Typography>
              )}
              {listing.networking && (
                <Typography 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: '#757575',
                    lineHeight: 1.3,
                  }}
                >
                  {listing.networking}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Pricing and Shipping Section */}
          <Box sx={{ px: 2, pb: 2, pt: 0.5, mt: 'auto', display: 'flex', flexDirection: 'column', flex: '0 0 auto' }}>
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
              ${(Math.random() * 200000 + 100000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>

            {/* Shipping */}
            <Typography 
              sx={{ 
                fontSize: '0.8125rem', 
                color: '#8547B7',
                fontWeight: 400,
                mb: 0.5,
                lineHeight: 1.3,
              }}
            >
              Free shipping
            </Typography>

            {/* Location */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
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
              }}
            >
              • Certified optional
            </Typography>
          </Box>
        </Card>
      </Box>
    );
  }

  // ---------- Featured Card Component ----------
  function FeaturedListingCard({ listing }) {
    return (
      <Box sx={{ width: FEATURED_CARD_W }}>
        <Card
          onClick={() => navigate(`/product/${listing.id}`)}
          sx={{
            height: FEATURED_CARD_H,
            position: 'relative',
            cursor: 'pointer',
            border: 'none',
            '&:hover': { 
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)', 
              transform: 'translateY(-2px)', 
              transition: 'all 0.25s ease',
            },
            borderRadius: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {/* VERIFIED Badge - Top Left */}
          <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 3 }}>
            <Chip
              label="VERIFIED"
              size="small"
              sx={{ 
                backgroundColor: '#5D40BD', 
                color: 'white', 
                fontWeight: 700, 
                fontSize: '0.65rem',
                height: 22,
                px: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRadius: '4px',
              }}
            />
          </Box>

          {/* NVIDIA Badge - Top Right */}
          <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 3 }}>
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
                borderRadius: '4px',
              }}
            />
          </Box>

          {/* Content */}
          <Box sx={{ px: 2, pt: 4.5, pb: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* GPU Model Name */}
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 700,
                fontSize: '1.25rem',
                color: '#212121',
                mb: 0.5,
                lineHeight: 1.2,
              }}
            >
              {listing.gpuModel}
            </Typography>

            {/* Chassis */}
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.8125rem',
                color: '#757575',
                mb: 1,
                lineHeight: 1.3,
              }}
            >
              {listing.chassis}
            </Typography>

            {/* Brand Label */}
            <Typography 
              sx={{ 
                fontSize: '0.8125rem', 
                color: '#757575',
                mb: 0.5,
                fontWeight: 400,
              }}
            >
              NVIDIA
            </Typography>

            {/* Server Type */}
            <Typography 
              sx={{ 
                fontSize: '0.9375rem', 
                fontWeight: 600,
                color: '#212121',
                mb: 0.75,
                lineHeight: 1.3,
              }}
            >
              {listing.gpuModel} Server
            </Typography>

            {/* Specs */}
            <Box sx={{ mb: 'auto' }}>
              {listing.gpuCount && (
                <Typography 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: '#757575',
                    mb: 0.4,
                    lineHeight: 1.3,
                  }}
                >
                  {listing.gpuCount}x {listing.gpuModel} {listing.ram ? `• ${listing.ram}GB RAM` : ''}
                </Typography>
              )}
              {listing.cpuModel && (
                <Typography 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: '#757575',
                    mb: 0.4,
                    lineHeight: 1.3,
                  }}
                >
                  {listing.cpuCount ? `${listing.cpuCount}x` : ''} {listing.cpuModel}
                </Typography>
              )}
              {listing.storage && (
                <Typography 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: '#757575',
                    mb: 0.4,
                    lineHeight: 1.3,
                  }}
                >
                  {listing.storage}
                </Typography>
              )}
              {listing.networking && (
                <Typography 
                  sx={{ 
                    fontSize: '0.75rem', 
                    color: '#757575',
                    lineHeight: 1.3,
                  }}
                >
                  {listing.networking}
                </Typography>
              )}
            </Box>

            {/* Price at Bottom */}
            <Typography 
              sx={{ 
                fontSize: '1.125rem', 
                fontWeight: 700,
                color: '#8547B7',
                letterSpacing: '-0.02em',
                mt: 'auto',
                pt: 1.5,
                lineHeight: 1.2,
              }}
            >
              from ${(Math.random() * 200000 + 100000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', minHeight: '100vh', overflowX: 'hidden' }}>
        {/* Left Sidebar */}
        <Box
          sx={{
            width: 280,
            backgroundColor: 'white',
            color: '#212121',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            height: '100vh',
            overflowY: 'auto',
            borderRight: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* Logo */}
          <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Nimbus Logo"
              onClick={() => window.open('https://gpu-landing-page.vercel.app/', '_blank')}
              sx={{
                height: 'auto',
                maxWidth: '100%',
                maxHeight: 60,
                objectFit: 'contain',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            />
          </Box>

          {/* Navigation */}
          <Box sx={{ flex: 1, pl: 3, pr: 3, py: 2 }}>
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.5,
                  px: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                }}
              >
                <Verified sx={{ 
                  mr: 2, 
                  fontSize: 20, 
                  background: 'linear-gradient(135deg, #8547B7 0%, #5D40BD 50%, #AE42BB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }} />
                <Typography variant="body2" sx={{ color: '#212121' }}>
                  AI Hardware Marketplace
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.5,
                  px: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                }}
              >
                <Security sx={{ 
                  mr: 2, 
                  fontSize: 20, 
                  background: 'linear-gradient(135deg, #8547B7 0%, #5D40BD 50%, #AE42BB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }} />
                <Typography variant="body2" sx={{ color: '#212121' }}>Browse Listings</Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.5,
                  px: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                }}
              >
                <Speed sx={{ 
                  mr: 2, 
                  fontSize: 20, 
                  background: 'linear-gradient(135deg, #8547B7 0%, #5D40BD 50%, #AE42BB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }} />
                <Typography variant="body2" sx={{ color: '#212121' }}>Make Offers</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(0,0,0,0.6)', mb: 1.5, px: 1, fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.5px' }}>
                MY RESOURCES
              </Typography>
              <Box
                onClick={() => navigate('/myoffers')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1.5,
                  px: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Visibility sx={{ 
                    mr: 2, 
                    fontSize: 20, 
                    background: 'linear-gradient(135deg, #8547B7 0%, #5D40BD 50%, #AE42BB 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }} />
                  <Typography variant="body2" sx={{ color: '#212121' }}>My Offers</Typography>
                </Box>
                {offersCount > 0 && (
                  <Badge
                    badgeContent={offersCount}
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#AE42BB',
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
                  py: 1.5,
                  px: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                }}
              >
                <AccountBalance sx={{ 
                  mr: 2, 
                  fontSize: 20, 
                  background: 'linear-gradient(135deg, #8547B7 0%, #5D40BD 50%, #AE42BB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }} />
                <Typography variant="body2" sx={{ color: '#212121' }}>My Deals</Typography>
              </Box>
              <Box
                onClick={() => navigate('/change-password')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.5,
                  px: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                }}
              >
                <Security sx={{ 
                  mr: 2, 
                  fontSize: 20, 
                  background: 'linear-gradient(135deg, #8547B7 0%, #5D40BD 50%, #AE42BB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }} />
                <Typography variant="body2" sx={{ color: '#212121' }}>Change Password</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(0,0,0,0.6)', mb: 1.5, px: 1, fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.5px' }}>
                EXPLORE
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.5,
                  px: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                }}
              >
                <Typography variant="body2" sx={{ color: '#212121' }}>Community</Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1.5,
                  px: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                }}
              >
                <Typography variant="body2" sx={{ color: '#212121' }}>Documentation</Typography>
              </Box>
            </Box>
          </Box>

          {/* Bottom Actions */}
          {!currentUser && (
            <Box sx={{ px: 3, pb: 3, pt: 2 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/login')}
                sx={{
                  backgroundColor: '#5D40BD',
                  color: 'white',
                  mb: 1.5,
                  py: 1.5,
                  '&:hover': { backgroundColor: '#4a35a0' },
                }}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/signup/buyer')}
                sx={{
                  borderColor: '#5D40BD',
                  color: '#5D40BD',
                  py: 1.5,
                  '&:hover': { borderColor: '#4a35a0', backgroundColor: 'rgba(93, 64, 189, 0.05)' },
                }}
              >
                Get Started
              </Button>
            </Box>
          )}
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            flex: 1,
            marginLeft: '280px',
            backgroundColor: 'white',
            position: 'relative',
            overflowX: 'hidden',
            width: 'calc(100% - 280px)',
            maxWidth: '100vw',
            '&::before': {
              content: '""',
              position: 'fixed',
              top: 0,
              left: 280,
              right: 0,
              bottom: 0,
              // background:
              //   'radial-gradient(circle at 20% 50%, rgba(26, 35, 126, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(26, 35, 126, 0.05) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(63, 81, 181, 0.05) 0%, transparent 50%)',
              backgroundSize: '100% 100%',
              pointerEvents: 'none',
              zIndex: 0,
            },
            '&::after': {
              content: '""',
              position: 'fixed',
              top: 0,
              left: 280,
              right: 0,
              bottom: 0,
              backgroundImage: `radial-gradient(2px 2px at 25% 25%, rgba(93, 64, 189, 0.1), transparent),
                            radial-gradient(1px 1px at 75% 75%, rgba(133, 71, 183, 0.1), transparent),
                            radial-gradient(1.5px 1.5px at 50% 50%, rgba(174, 66, 187, 0.1), transparent),
                            radial-gradient(2px 2px at 10% 10%, rgba(93, 64, 189, 0.08), transparent),
                            radial-gradient(1.5px 1.5px at 90% 90%, rgba(133, 71, 183, 0.08), transparent),
                            radial-gradient(2px 2px at 30% 70%, rgba(174, 66, 187, 0.08), transparent),
                            radial-gradient(1px 1px at 60% 40%, rgba(93, 64, 189, 0.1), transparent),
                            radial-gradient(1.5px 1.5px at 85% 15%, rgba(133, 71, 183, 0.08), transparent),
                            radial-gradient(2px 2px at 15% 85%, rgba(174, 66, 187, 0.08), transparent),
                            radial-gradient(1px 1px at 45% 45%, rgba(93, 64, 189, 0.1), transparent)`,
              backgroundSize:
                '100% 100%, 50% 50%, 70% 70%, 40% 40%, 60% 60%, 30% 30%, 80% 80%, 55% 55%, 45% 45%, 65% 65%',
              backgroundPosition:
                '0% 0%, 100% 100%, 50% 50%, 0% 100%, 100% 0%, 50% 100%, 0% 50%, 100% 50%, 25% 75%, 75% 25%',
              animation: 'particleFloat 20s infinite linear',
              pointerEvents: 'none',
              zIndex: 0,
            },
            '@keyframes particleFloat': {
              '0%': {
                backgroundPosition:
                  '0% 0%, 100% 100%, 50% 50%, 0% 100%, 100% 0%, 50% 100%, 0% 50%, 100% 50%, 25% 75%, 75% 25%',
              },
              '100%': {
                backgroundPosition:
                  '100% 100%, 0% 0%, 50% 50%, 100% 0%, 0% 100%, 50% 0%, 100% 50%, 0% 50%, 75% 25%, 25% 75%',
              },
            },
          }}
        >
          {/* Top Banner */}
          {/* <Box
            sx={{
              backgroundColor: '#424242',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rocket sx={{ mr: 1 }} />
              <Typography variant="body2">
                Try our mobile app!
              </Typography>
            </Box>
          </Box> */}

          {/* Breadcrumbs */}
          <Box sx={{ p: 3, backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', position: 'relative', zIndex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Home &gt; AI Hardware Marketplace
            </Typography>
          </Box>

          {/* Main Content */}
          <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
            {/* Featured */}
            {/* <Box mb={6}>
              <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="#5D40BD">
                Featured AI Hardware
              </Typography>
              <Typography variant="h6" color="text.secondary" paragraph>
                Discover premium AI servers from verified sellers worldwide
              </Typography>

              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box
                  sx={{
                    maxWidth: '90%',
                    mx: 'auto',
                    px: 2.5,
                    py: 2.5,

                    position: 'relative',
                    overflow: 'hidden',
                    mb: 4,
                    borderRadius: '12px',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 10%, rgba(255,255,255,0) 90%, rgba(255,255,255,1) 100%)',
                      zIndex: 2,
                      pointerEvents: 'none',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      animation: 'scroll 30s linear infinite',
                      '@keyframes scroll': {
                        '0%': { transform: 'translateX(0)' },
                        '100%': { transform: 'translateX(-50%)' },
                      },
                      '&:hover': { animationPlayState: 'paused' },
                    }}
                  >
                    {filteredListings.slice(0, 4).map((l) => (
                      <Box key={`first-${l.id}`} sx={{ width: FEATURED_CARD_W, mr: 2.5, flex: '0 0 auto' }}>
                        <FeaturedListingCard listing={l} />
                      </Box>
                    ))}
                    {filteredListings.slice(0, 4).map((l) => (
                      <Box key={`second-${l.id}`} sx={{ width: FEATURED_CARD_W, mr: 2.5, flex: '0 0 auto' }}>
                        <FeaturedListingCard listing={l} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              <Box textAlign="center">
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: '#8547B7',
                    px: 4,
                    py: 1.5,
                    borderRadius: '25px',
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    '&:hover': { backgroundColor: '#5D40BD' },
                  }}
                  onClick={() => document.getElementById('main-listings')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View All Listings
                </Button>
              </Box>
            </Box> */}

            {/* Filters */}
            <Box mb={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {/* Search */}
                <TextField
                  placeholder="Search GPU model, chassis, or seller..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  size="small"
                  sx={{
                    minWidth: 250,
                    flex: 1,
                    maxWidth: 400,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '20px',
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #ccc',
                      '& fieldset': { border: 'none' },
                      '&:hover fieldset': { border: 'none' },
                      '&.Mui-focused fieldset': { border: '1px solid #666' },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: '#666' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* GPU Model Filter */}
                <Button
                  variant={filters.gpuModel ? 'contained' : 'outlined'}
                  onClick={(e) => setFilterMenuAnchor({ ...filterMenuAnchor, gpu: e.currentTarget })}
                  endIcon={<ArrowDropDown />}
                  sx={{
                    borderRadius: '20px',
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    borderColor: '#ccc',
                    color: filters.gpuModel ? 'white' : '#333',
                    backgroundColor: filters.gpuModel ? '#8547B7' : 'transparent',
                    '&:hover': {
                      backgroundColor: filters.gpuModel ? '#5D40BD' : 'rgba(0,0,0,0.05)',
                      borderColor: filters.gpuModel ? '#5D40BD' : '#999',
                    },
                  }}
                >
                  GPU Model {filters.gpuModel && `: ${filters.gpuModel}`}
                </Button>
                <Menu
                  anchorEl={filterMenuAnchor.gpu}
                  open={Boolean(filterMenuAnchor.gpu)}
                  onClose={() => setFilterMenuAnchor({ ...filterMenuAnchor, gpu: null })}
                >
                  <MenuItem onClick={() => { handleFilterChange('gpuModel', ''); setFilterMenuAnchor({ ...filterMenuAnchor, gpu: null }); }}>
                    <ListItemText>All GPUs</ListItemText>
                  </MenuItem>
                  <Divider />
                  {['H100', 'H200', 'A100', 'B200', 'V100'].map((gpu) => (
                    <MenuItem
                      key={gpu}
                      onClick={() => {
                        handleFilterChange('gpuModel', gpu);
                        setFilterMenuAnchor({ ...filterMenuAnchor, gpu: null });
                      }}
                      selected={filters.gpuModel === gpu}
                    >
                      <ListItemText>{gpu}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>

                {/* Condition Filter */}
                <Button
                  variant={filters.condition ? 'contained' : 'outlined'}
                  onClick={(e) => setFilterMenuAnchor({ ...filterMenuAnchor, condition: e.currentTarget })}
                  endIcon={<ArrowDropDown />}
                  sx={{
                    borderRadius: '20px',
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    borderColor: '#ccc',
                    color: filters.condition ? 'white' : '#333',
                    backgroundColor: filters.condition ? '#8547B7' : 'transparent',
                    '&:hover': {
                      backgroundColor: filters.condition ? '#5D40BD' : 'rgba(0,0,0,0.05)',
                      borderColor: filters.condition ? '#5D40BD' : '#999',
                    },
                  }}
                >
                  Condition {filters.condition && `: ${filters.condition.charAt(0).toUpperCase() + filters.condition.slice(1)}`}
                </Button>
                <Menu
                  anchorEl={filterMenuAnchor.condition}
                  open={Boolean(filterMenuAnchor.condition)}
                  onClose={() => setFilterMenuAnchor({ ...filterMenuAnchor, condition: null })}
                >
                  <MenuItem onClick={() => { handleFilterChange('condition', ''); setFilterMenuAnchor({ ...filterMenuAnchor, condition: null }); }}>
                    <ListItemText>All Conditions</ListItemText>
                  </MenuItem>
                  <Divider />
                  {['New', 'Used', 'Refurbished'].map((condition) => (
                    <MenuItem
                      key={condition}
                      onClick={() => {
                        handleFilterChange('condition', condition.toLowerCase());
                        setFilterMenuAnchor({ ...filterMenuAnchor, condition: null });
                      }}
                      selected={filters.condition === condition.toLowerCase()}
                    >
                      <ListItemText>{condition}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>

                {/* Location Filter */}
                <Button
                  variant={filters.location ? 'contained' : 'outlined'}
                  onClick={(e) => setFilterMenuAnchor({ ...filterMenuAnchor, location: e.currentTarget })}
                  endIcon={<ArrowDropDown />}
                  sx={{
                    borderRadius: '20px',
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    borderColor: '#ccc',
                    color: filters.location ? 'white' : '#333',
                    backgroundColor: filters.location ? '#8547B7' : 'transparent',
                    '&:hover': {
                      backgroundColor: filters.location ? '#5D40BD' : 'rgba(0,0,0,0.05)',
                      borderColor: filters.location ? '#5D40BD' : '#999',
                    },
                  }}
                >
                  Location {filters.location && `: ${filters.location}`}
                </Button>
                <Menu
                  anchorEl={filterMenuAnchor.location}
                  open={Boolean(filterMenuAnchor.location)}
                  onClose={() => setFilterMenuAnchor({ ...filterMenuAnchor, location: null })}
                >
                  <MenuItem onClick={() => { handleFilterChange('location', ''); setFilterMenuAnchor({ ...filterMenuAnchor, location: null }); }}>
                    <ListItemText>All Locations</ListItemText>
                  </MenuItem>
                  <Divider />
                  {['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Netherlands'].map((location) => (
                    <MenuItem
                      key={location}
                      onClick={() => {
                        handleFilterChange('location', location);
                        setFilterMenuAnchor({ ...filterMenuAnchor, location: null });
                      }}
                      selected={filters.location === location}
                    >
                      <ListItemText>{location}</ListItemText>
                    </MenuItem>
                  ))}
                </Menu>

                {/* Clear Filters */}
                {Object.values(filters).some((f) => f !== '') && (
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    sx={{
                      borderRadius: '20px',
                      px: 2,
                      py: 1,
                      textTransform: 'none',
                      borderColor: '#ccc',
                      color: '#666',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        borderColor: '#999',
                      },
                    }}
                  >
                    Clear All
                  </Button>
                )}

                {/* Sort */}
                <Box sx={{ ml: 'auto' }}>
                  <FormControl size="small">
                    <Select
                      value="relevance"
                      sx={{
                        backgroundColor: '#f5f5f5',
                        borderRadius: '20px',
                        border: '1px solid #ccc',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      }}
                    >
                      <MenuItem value="relevance">Sort by Relevance</MenuItem>
                      <MenuItem value="price-low">Price: Low to High</MenuItem>
                      <MenuItem value="price-high">Price: High to Low</MenuItem>
                      <MenuItem value="newest">Newest First</MenuItem>
                      <MenuItem value="oldest">Oldest First</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Active Filters */}
              {Object.values(filters).some((f) => f !== '') && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    {filters.gpuModel && (
                      <Chip
                        label={`GPU: ${filters.gpuModel}`}
                        onDelete={() => handleFilterChange('gpuModel', '')}
                        sx={{ backgroundColor: '#e0e0e0', borderColor: '#ccc', color: '#333' }}
                      />
                    )}
                    {filters.condition && (
                      <Chip
                        label={`Condition: ${filters.condition}`}
                        onDelete={() => handleFilterChange('condition', '')}
                        sx={{ backgroundColor: '#e0e0e0', borderColor: '#ccc', color: '#333' }}
                      />
                    )}
                    {filters.location && (
                      <Chip
                        label={`Location: ${filters.location}`}
                        onDelete={() => handleFilterChange('location', '')}
                        sx={{ backgroundColor: '#e0e0e0', borderColor: '#ccc', color: '#333' }}
                      />
                    )}
                    {filters.seller && (
                      <Chip
                        label={`Seller: ${filters.seller}`}
                        onDelete={() => handleFilterChange('seller', '')}
                        sx={{ backgroundColor: '#e0e0e0', borderColor: '#ccc', color: '#333' }}
                      />
                    )}
                    {filters.searchTerm && (
                      <Chip
                        label={`Search: ${filters.searchTerm}`}
                        onDelete={() => handleFilterChange('searchTerm', '')}
                        sx={{ backgroundColor: '#e0e0e0', borderColor: '#ccc', color: '#333' }}
                      />
                    )}
                  </Box>
                </Box>
              )}

              {/* Results Count */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredListings.length} listings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  •
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  including verified listings
                </Typography>
              </Box>
            </Box>

            {/* Main Listings */}
            <Box mb={6} id="main-listings">
              {loading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : filteredListings.length > 0 ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Grid container spacing={2} sx={{ width: 'auto', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {(() => {
                        // Pagination calculations
                        const startIndex = (page - 1) * itemsPerPage;
                        const paginatedListings = filteredListings.slice(startIndex, startIndex + itemsPerPage);
                        
                        return paginatedListings.map((l) => (
                          <Grid item key={l.id} sx={{ display: 'flex' }}>
                            <ListingCard listing={l} />
                          </Grid>
                        ));
                      })()}
                    </Grid>
                  </Box>
                  
                  {/* Pagination */}
                  {filteredListings.length > itemsPerPage && (
                    <Box display="flex" justifyContent="center" mt={4} mb={2}>
                      <Pagination
                        count={Math.ceil(filteredListings.length / itemsPerPage)}
                        page={page}
                        onChange={(event, value) => {
                          setPage(value);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary">
                    No verified listings available at the moment
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Check back soon for new AI hardware listings
                  </Typography>
                </Paper>
              )}
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Footer
      <Box sx={{ backgroundColor: '#5D40BD', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Nimbus Marketplace
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                The first transparent marketplace for AI servers — where every listing is verified, every transaction is
                protected.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <IconButton sx={{ color: 'white' }}>
                  <Box sx={{ fontSize: 20 }}>📧</Box>
                </IconButton>
                <IconButton sx={{ color: 'white' }}>
                  <Box sx={{ fontSize: 20 }}>🐦</Box>
                </IconButton>
                <IconButton sx={{ color: 'white' }}>
                  <Box sx={{ fontSize: 20 }}>💼</Box>
                </IconButton>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Marketplace
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Browse Listings
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  H100 Servers
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  H200 Servers
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  A100 Servers
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                For Sellers
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Start Selling
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Seller Dashboard
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Verification Process
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Pricing Guide
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Support
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Help Center
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Contact Us
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Documentation
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  API Reference
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Legal
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Terms of Service
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Privacy Policy
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Cookie Policy
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                  Compliance
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box
            sx={{
              borderTop: '1px solid rgba(255,255,255,0.2)',
              mt: 4,
              pt: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              © 2024 Nimbus Marketplace. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                🔒 SSL Secured
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                ✅ Verified Transactions
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                🌍 Global Shipping
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box> */}
    </>
  );
}

export default LandingPage;