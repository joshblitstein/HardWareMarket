import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Alert,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import { ArrowBack, ShoppingCart } from '@mui/icons-material';
import { generateContractTemplate } from '../utils/contractTemplate';

function PurchaseInitiation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [listing, setListing] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userProfile || userProfile.userType !== 'buyer') {
      navigate('/login');
      return;
    }
    fetchListing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userProfile]);

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

  const handleCreateContract = async () => {
    if (!listing || !userProfile) return;
    
    setCreating(true);
    setError('');

    try {
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
        productName: `${listing.gpuModel} Server`,
        gpuModel: listing.gpuModel,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        location: listing.physicalLocation || 'TBD',
        listingDetails: `${listing.gpuCount}x ${listing.gpuModel}, ${listing.ram}GB RAM, ${listing.storage}`
      });

      // Create contract in Firestore
      const contractData = {
        listingId: listing.id,
        sellerId: listing.sellerId, // Use sellerId from listing
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

      // Debug: Log the contract data before creation
      console.log('Creating contract with sellerId:', contractData.sellerId);
      console.log('Listing sellerId:', listing.sellerId);
      console.log('Listing sellerName:', listing.sellerName);
      console.log('Full contract data:', contractData);

      const contractRef = await addDoc(collection(db, 'contracts'), contractData);
      
      console.log('Contract created with ID:', contractRef.id);
      console.log('Contract sellerId:', contractData.sellerId);
      
      // Update listing status to 'in_contract' to hide it from marketplace
      try {
        const listingRef = doc(db, 'listings', listing.id);
        await updateDoc(listingRef, {
          status: 'in_contract',
          contractId: contractRef.id, // Store reference to active contract
          updatedAt: new Date(),
        });
        console.log('✅ Listing marked as in_contract:', listing.id);
      } catch (listingError) {
        console.error('❌ Error updating listing status:', listingError);
        // Don't throw - contract is created, listing update failure is not critical
      }
      
      // Navigate to contract signing page
      navigate(`/contract/${contractRef.id}`);
    } catch (err) {
      console.error('Error creating contract:', err);
      setError('Failed to create contract. Please try again.');
    } finally {
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

  if (error && !listing) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!listing) return null;

  const unitPrice = listing.price || 50000;
  const totalPrice = unitPrice * quantity;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={4}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/product/${id}`)} sx={{ mb: 2 }}>
          Back to Product
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Initiate Purchase
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review your purchase details and create a contract
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Purchase Summary
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {listing.gpuModel} Server
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {listing.chassis}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Unit Price
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  ${unitPrice.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Quantity
                </Typography>
                <TextField
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: 1, max: listing.quantity }}
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
                  ${totalPrice.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Next Steps
              </Typography>
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
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<ShoppingCart />}
              onClick={handleCreateContract}
              disabled={creating || quantity > listing.quantity}
              sx={{ py: 1.5 }}
            >
              {creating ? 'Creating Contract...' : 'Create Contract'}
            </Button>

            {quantity > listing.quantity && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Quantity exceeds available stock ({listing.quantity} units)
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default PurchaseInitiation;

