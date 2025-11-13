import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  AttachMoney,
  CheckCircle,
} from '@mui/icons-material';

function MakeOffer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    quantity: 1,
    targetDeliveryWindow: '',
    notes: '',
  });

  useEffect(() => {
    if (!userProfile || userProfile.userType !== 'buyer') {
      navigate('/login');
      return;
    }
    fetchListing();
  }, [id, userProfile, navigate]);

  const fetchListing = async () => {
    try {
      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const listingData = { id: docSnap.id, ...docSnap.data() };
        setListing(listingData);
        
        // Set default quantity to 1, max to listing quantity
        setFormData(prev => ({
          ...prev,
          quantity: 1,
        }));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.quantity || formData.quantity < 1) {
      setError('Please enter a valid quantity (at least 1)');
      return;
    }

    if (formData.quantity > listing.quantity) {
      setError(`Quantity cannot exceed available units (${listing.quantity})`);
      return;
    }

    // Use listing price as offer price (since there's no price field in the form)
    const offerPrice = listing.price || 0;

    setSubmitting(true);

    try {
      // Create offer document
      const offerData = {
        listingId: listing.id,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        buyerId: userProfile.id,
        buyerName: userProfile.fullName || userProfile.companyName || userProfile.email,
        buyerEmail: userProfile.email,
        gpuModel: listing.gpuModel || 'GPU Server',
        listingPrice: listing.price || 0,
        offerPrice: offerPrice,
        quantity: formData.quantity,
        targetDeliveryWindow: formData.targetDeliveryWindow || 'Not specified',
        notes: formData.notes || '',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'offers'), offerData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/product/${id}`);
      }, 2000);
    } catch (err) {
      console.error('Error creating offer:', err);
      setError('Failed to submit offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !listing) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Container>
    );
  }

  if (!listing) return null;

  const offerPrice = listing.price || 0;
  const totalOfferValue = offerPrice * (formData.quantity || 1);

  return (
    <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh', py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container maxWidth="xl" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box mb={5} sx={{ textAlign: 'center', width: '100%' }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            Make an Offer
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Submit your offer for {listing.gpuModel || 'this listing'}
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 4, maxWidth: 800, width: '100%' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle />
              <Typography>
                Offer submitted successfully! Redirecting to product page...
              </Typography>
            </Box>
          </Alert>
        )}

        {error && !success && (
          <Alert severity="error" sx={{ mb: 4, maxWidth: 800, width: '100%' }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4} sx={{ maxWidth: 1200, width: '100%', justifyContent: 'center' }}>
          {/* Listing Details Card - Left */}
          <Grid item xs={12} md={8}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 4, fontSize: '1.5rem' }}>
                  Listing Details
                </Typography>
                
                <Box mb={3}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontSize: '0.95rem' }}>
                    GPU Model
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                    {listing.gpuModel || 'N/A'} × {listing.gpuCount || 'N/A'}
                  </Typography>
                </Box>

                <Box mb={3}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontSize: '0.95rem' }}>
                    Available Units
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                    {listing.quantity || 1} {listing.quantity === 1 ? 'unit' : 'units'}
                  </Typography>
                </Box>

                <Box mb={3}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontSize: '0.95rem' }}>
                    Listing Price (per unit)
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '1.25rem' }}>
                    {listing.price ? `$${listing.price.toLocaleString()}` : 'N/A'}
                  </Typography>
                </Box>

                <Box mb={3}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontSize: '0.95rem' }}>
                    Seller
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                    {listing.sellerName || 'Unknown Seller'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1, fontSize: '0.95rem' }}>
                    Total Offer Value
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', fontSize: '1.5rem' }}>
                    ${totalOfferValue.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Offer Form - Right */}
          <Grid item xs={12} md={4}>
            <Card sx={{ boxShadow: 3, height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Quantity *"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    inputProps={{ min: 1, max: listing.quantity || 1 }}
                    helperText={`Max. ${listing.quantity || 1} ${listing.quantity === 1 ? 'unit' : 'units'}`}
                    sx={{ mb: 3 }}
                    size="medium"
                  />

                  <TextField
                    fullWidth
                    label="Target Delivery Window"
                    name="targetDeliveryWindow"
                    value={formData.targetDeliveryWindow}
                    onChange={handleInputChange}
                    placeholder="Target Delivery Window"
                    sx={{ mb: 3 }}
                    size="medium"
                  />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={submitting || success}
                      startIcon={<AttachMoney />}
                      fullWidth
                      sx={{ py: 2, fontSize: '1rem', fontWeight: 600 }}
                    >
                      {submitting ? 'Submitting...' : success ? 'Submitted!' : 'Submit Offer'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate(-1)}
                      disabled={submitting}
                      fullWidth
                      sx={{ py: 2, fontSize: '1rem' }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default MakeOffer;

