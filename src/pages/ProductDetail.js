import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Divider,
  IconButton,
  Alert,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  Verified,
  LocationOn,
  Memory,
  Speed,
  CheckCircle,
  ShoppingCart,
} from '@mui/icons-material';
import SensitiveDataDisplay from '../components/SensitiveDataDisplay';
import { generateContractTemplate } from '../utils/contractTemplate';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [creating, setCreating] = useState(false);
  const [relatedListings, setRelatedListings] = useState([]);

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (listing) {
      fetchRelatedListings();
    }
  }, [listing]);

  const fetchListing = async () => {
    try {
      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setListing({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('Listing not found');
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedListings = async () => {
    try {
      if (!listing) return;

      let querySnapshot;
      try {
        // Try to fetch listings with same GPU model, excluding current listing
        const q = query(
          collection(db, 'listings'),
          where('verified', '==', true),
          where('status', '==', 'active'),
          where('gpuModel', '==', listing.gpuModel || ''),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        // If orderBy fails or no GPU model match, fetch any active listings
        const q = query(
          collection(db, 'listings'),
          where('verified', '==', true),
          where('status', '==', 'active')
        );
        querySnapshot = await getDocs(q);
      }

      const relatedData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(l => l.id !== listing.id && l.verified === true && l.status === 'active')
        .slice(0, 4); // Limit to 4 related items

      setRelatedListings(relatedData);
    } catch (err) {
      console.error('Error fetching related listings:', err);
      setRelatedListings([]);
    }
  };

  const handleMakeOffer = () => {
    if (userProfile?.userType !== 'buyer') {
      navigate('/login');
      return;
    }
    // Navigate to make offer page
    navigate(`/product/${id}/make-offer`);
  };

  const handleCreateContract = async () => {
    if (!listing || !userProfile) return;
    
    setCreating(true);
    setError('');

    try {
      // Validate quantity
      if (quantity < 1 || quantity > (listing.quantity || 1)) {
        setError(`Quantity must be between 1 and ${listing.quantity || 1}`);
        setCreating(false);
        return;
      }

      // Fetch seller information
      const sellerDoc = await getDoc(doc(db, 'users', listing.sellerId));
      if (!sellerDoc.exists()) {
        throw new Error('Seller information not found');
      }
      const sellerData = sellerDoc.data();

      // Calculate pricing
      const unitPrice = listing.price || 50000; // Fallback price
      const totalPrice = unitPrice * quantity;

      // Generate contract template
      const contractText = generateContractTemplate({
        buyerName: userProfile.companyName || userProfile.name || userProfile.email,
        buyerEmail: userProfile.email,
        sellerName: listing.sellerName || sellerData.companyName || sellerData.name || 'Seller',
        sellerCompany: listing.sellerName,
        productName: `${listing.gpuModel || 'GPU'} Server`,
        gpuModel: listing.gpuModel || 'GPU',
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        location: listing.physicalLocation || 'TBD',
        listingDetails: `${listing.gpuCount || 'N/A'}x ${listing.gpuModel || 'GPU'}, ${listing.ram || 'N/A'}GB RAM, ${listing.storage || 'N/A'}`
      });

      // Create contract in Firestore
      const contractData = {
        listingId: listing.id,
        sellerId: listing.sellerId,
        buyerId: userProfile.id,
        contractTemplate: contractText,
        quantity: quantity,
        agreedPrice: unitPrice,
        totalValue: totalPrice,
        status: 'pending_buyer_signature',
        version: 1,
        createdAt: new Date(),
        buyerSignature: null,
        sellerSignature: null,
        buyerSignedAt: null,
        sellerSignedAt: null,
        completedAt: null,
      };

      const contractRef = await addDoc(collection(db, 'contracts'), contractData);
      
      // Update listing status to 'in_contract' to hide it from marketplace
      try {
        const listingRef = doc(db, 'listings', listing.id);
        await updateDoc(listingRef, {
          status: 'in_contract',
          contractId: contractRef.id,
          updatedAt: new Date(),
        });
      } catch (listingError) {
        console.error('Error updating listing status:', listingError);
      }
      
      // Navigate directly to contract signing page
      navigate(`/contract/${contractRef.id}`);
    } catch (err) {
      console.error('Error creating contract:', err);
      setError('Failed to create contract. Please try again.');
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !listing) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Listing not found'}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Back to Marketplace
        </Button>
      </Container>
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
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Product Details
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Main Content - Full Width */}
          <Grid item xs={12}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {listing.gpuModel} Server
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {listing.chassis}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip
                      label="NVIDIA"
                      sx={{
                        backgroundColor: '#76b900',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                    {listing.verified && (
                      <Chip
                        icon={<Verified />}
                        label="Verified"
                        color="success"
                      />
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Specifications */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Specifications
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Memory color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          GPU Model
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {listing.gpuModel || 'N/A'} × {listing.gpuCount || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Speed color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          CPU
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {listing.cpuModel || 'N/A'} × {listing.cpuCount || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      RAM
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {listing.ram || 'N/A'}GB
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Storage
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {listing.storage || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Networking
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {listing.networking || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Cooling
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {listing.cooling === 'air' ? 'Air Cooling' : listing.cooling === 'liquid' ? 'Liquid Cooling' : listing.cooling || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Additional Details */}
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Additional Information
                </Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    All additional information below is protected under NDA. Click on any field to view details.
                  </Typography>
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <SensitiveDataDisplay
                      label="Condition"
                      value={listing.condition ? listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1) + (listing.conditionNote ? ` - ${listing.conditionNote}` : '') : 'N/A'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <SensitiveDataDisplay
                      label="Location"
                      value={listing.physicalLocation}
                      icon={LocationOn}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <SensitiveDataDisplay
                      label="Year of Purchase"
                      value={listing.yearOfPurchase}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <SensitiveDataDisplay
                      label="Warranty Status"
                      value={listing.warrantyStatus ? listing.warrantyStatus.charAt(0).toUpperCase() + listing.warrantyStatus.slice(1) : 'N/A'}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Seller Information - Hidden to prevent circumvention */}
            <Card sx={{ border: '1px dashed #ccc', backgroundColor: '#fafafa', mb: 3 }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Seller Information
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  🔒 Locked
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign a purchase contract to view seller contact information.
                  This prevents transaction circumvention and protects both parties.
                </Typography>
              </CardContent>
            </Card>

            {/* Purchase Actions Section */}
            <Grid container spacing={3}>
              {/* Left Card - Purchase Summary */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Purchase Summary
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                        {listing.gpuModel || 'GPU'} Server
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {listing.chassis || 'Custom Build'} {listing.chassis && listing.gpuModel ? '•' : ''} {listing.gpuModel || 'N/A'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Unit Price
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        ${(listing.price || 50000).toLocaleString()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Quantity
                      </Typography>
                      <TextField
                        type="number"
                        value={quantity}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(listing.quantity || 1, parseInt(e.target.value) || 1));
                          setQuantity(val);
                        }}
                        inputProps={{ min: 1, max: listing.quantity || 1 }}
                        size="small"
                        sx={{ width: 100 }}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Total Price
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        ${((listing.price || 50000) * quantity).toLocaleString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Card - Next Steps */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                      Next Steps
                    </Typography>
                    <Box sx={{ mb: 3, flex: 1 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        1. Create contract
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        2. Review and sign contract
                      </Typography>
                      <Typography variant="body2">
                        3. Seller will sign after you sign
                      </Typography>
                    </Box>

                    {error && (
                      <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                      </Alert>
                    )}

                    {userProfile?.userType !== 'buyer' && (
                      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        {userProfile ? 'Only buyers can make purchases' : 'Please log in as a buyer to purchase'}
                      </Alert>
                    )}

                    {quantity > (listing.quantity || 1) && (
                      <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        Quantity exceeds available stock ({listing.quantity || 1} units)
                      </Alert>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<ShoppingCart />}
                      onClick={handleCreateContract}
                      disabled={creating || userProfile?.userType !== 'buyer' || quantity > (listing.quantity || 1)}
                      sx={{ py: 1.5 }}
                    >
                      {creating ? 'Creating Contract...' : 'Create Contract'}
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      size="medium"
                      onClick={handleMakeOffer}
                      disabled={userProfile?.userType !== 'buyer'}
                      sx={{ mt: 2, py: 1 }}
                    >
                      {userProfile?.userType === 'buyer' ? 'Make Offer Instead' : 'Login to Make Offer'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Related Items Section */}
            {relatedListings.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Related Items
                </Typography>
                <Grid container spacing={3}>
                  {relatedListings.map((relatedListing) => (
                    <Grid item xs={12} sm={6} md={3} key={relatedListing.id}>
                      <Card
                        onClick={() => navigate(`/product/${relatedListing.id}`)}
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
                          {/* Top Right - NVIDIA Badge */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              zIndex: 2,
                            }}
                          >
                            <Chip
                              label="NVIDIA"
                              size="small"
                              sx={{
                                backgroundColor: '#66bb6a',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>

                          {/* Content */}
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                              {relatedListing.gpuModel || 'GPU'} Server
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem' }}>
                              {relatedListing.chassis || 'Custom Build'}
                            </Typography>

                            {/* Specs */}
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                {relatedListing.gpuCount || 'N/A'}x {relatedListing.gpuModel || 'GPU'}
                              </Typography>
                              {relatedListing.ram && (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  {relatedListing.ram}GB RAM
                                </Typography>
                              )}
                            </Box>

                            {/* Price */}
                            <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e0e0e0' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                Price
                              </Typography>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '1.1rem' }}>
                                ${(relatedListing.price || 50000).toLocaleString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {relatedListing.quantity || 1} {relatedListing.quantity === 1 ? 'unit' : 'units'} available
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default ProductDetail;

