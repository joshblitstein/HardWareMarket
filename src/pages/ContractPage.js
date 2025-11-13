import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import SignaturePad from '../components/SignaturePad';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Lock,
  Download,
  Person,
  Email,
  Phone,
  Business,
  CheckCircle,
} from '@mui/icons-material';

function ContractPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [contract, setContract] = useState(null);
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!userProfile || userProfile.userType !== 'buyer') {
      navigate('/login');
      return;
    }
    fetchContract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId, userProfile]);

  const fetchContract = async () => {
    try {
      const contractRef = doc(db, 'contracts', contractId);
      const contractSnap = await getDoc(contractRef);
      
      if (!contractSnap.exists()) {
        setError('Contract not found');
        return;
      }

      const contractData = { id: contractSnap.id, ...contractSnap.data() };
      
      // Verify this contract belongs to the current user
      if (contractData.buyerId !== userProfile.id) {
        setError('You do not have access to this contract');
        return;
      }

      setContract(contractData);

      // Fetch listing details
      if (contractData.listingId) {
        const listingRef = doc(db, 'listings', contractData.listingId);
        const listingSnap = await getDoc(listingRef);
        if (listingSnap.exists()) {
          setListing({ id: listingSnap.id, ...listingSnap.data() });
        }
      }

      // Fetch seller information only if buyer has signed
      if (contractData.buyerSignature) {
        const sellerRef = doc(db, 'users', contractData.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          setSeller({ id: sellerSnap.id, ...sellerSnap.data() });
        }
      }
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError('Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSave = (signatureData) => {
    setSignature(signatureData);
    setConfirmDialogOpen(true);
  };

  const handleSignContract = async () => {
    if (!signature || !contract) return;

    setSigning(true);
    setError('');

    try {
      const contractRef = doc(db, 'contracts', contractId);
      const userAgent = navigator.userAgent;
      const ipAddress = 'N/A'; // Would need backend service for real IP

      await updateDoc(contractRef, {
        buyerSignature: {
          data: signature,
          signedAt: new Date(),
          ipAddress: ipAddress,
          userAgent: userAgent,
        },
        buyerSignedAt: new Date(),
        status: 'pending_seller_signature',
      });

      // Fetch seller information after signing
      const sellerRef = doc(db, 'users', contract.sellerId);
      const sellerSnap = await getDoc(sellerRef);
      if (sellerSnap.exists()) {
        setSeller({ id: sellerSnap.id, ...sellerSnap.data() });
      }

      setSuccess(true);
      setConfirmDialogOpen(false);
      
      // Refresh contract data
      await fetchContract();
    } catch (err) {
      console.error('Error signing contract:', err);
      setError('Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const handleCancelContract = async () => {
    if (!contract) return;
    
    if (!window.confirm('Are you sure you want to cancel this contract? The listing will be made available again in the marketplace.')) {
      return;
    }

    try {
      const contractRef = doc(db, 'contracts', contractId);
      
      // Get the full contract data
      const contractSnap = await getDoc(contractRef);
      if (!contractSnap.exists()) {
        setError('Contract not found');
        return;
      }
      
      const contractData = contractSnap.data();
      
      // Move contract to dep_contracts collection
      const depContractRef = doc(db, 'dep_contracts', contractId);
      await setDoc(depContractRef, {
        ...contractData,
        status: 'cancelled',
        cancelledAt: new Date(),
        deprecatedAt: new Date(),
        deprecatedReason: 'buyer_cancelled',
      });
      
      // Delete from contracts collection
      await deleteDoc(contractRef);
      console.log('✅ Contract moved to dep_contracts:', contractId);
      
      // Restore listing status to 'active' so it appears in marketplace again
      if (contract.listingId) {
        const listingRef = doc(db, 'listings', contract.listingId);
        const listingSnap = await getDoc(listingRef);
        
        if (listingSnap.exists()) {
          await updateDoc(listingRef, {
            status: 'active',
            contractId: null, // Clear contract reference
            updatedAt: new Date(),
          });
          console.log('✅ Listing restored to active:', contract.listingId);
        }
      }
      
      navigate('/');
    } catch (err) {
      console.error('Error cancelling contract:', err);
      setError('Failed to cancel contract. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !contract) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Container>
    );
  }

  if (!contract) return null;

  const buyerHasSigned = !!contract.buyerSignature;
  const bothHaveSigned = buyerHasSigned && !!contract.sellerSignature;

  return (
    <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Box mb={4}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
            Back
          </Button>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Purchase Contract
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contract ID: {contractId}
              </Typography>
            </Box>
            <Chip
              label={
                bothHaveSigned ? 'Completed' :
                buyerHasSigned ? 'Pending Seller Signature' :
                'Pending Your Signature'
              }
              color={
                bothHaveSigned ? 'success' :
                buyerHasSigned ? 'warning' :
                'default'
              }
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Contract Content */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Contract Terms
                </Typography>
                <Paper
                  sx={{
                    p: 3,
                    backgroundColor: '#fafafa',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    mb: 3,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                  }}
                >
                  {contract.contractTemplate}
                </Paper>

                {!buyerHasSigned && (
                  <Box>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Your Signature Required
                    </Typography>
                    <SignaturePad onSave={handleSignatureSave} />
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={handleCancelContract}
                    >
                      Cancel Contract
                    </Button>
                  </Box>
                )}

                {buyerHasSigned && !bothHaveSigned && (
                  <Alert severity="success" sx={{ mt: 3 }}>
                    ✓ You have signed this contract. Waiting for seller to sign.
                  </Alert>
                )}

                {bothHaveSigned && (
                  <Alert severity="success" sx={{ mt: 3 }}>
                    ✓ Contract completed! Both parties have signed.
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Seller Information - Only visible after buyer signs */}
            {buyerHasSigned && seller && (
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <CheckCircle color="success" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Seller Contact Information
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Person color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Seller Name
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {seller.companyName || seller.name || listing?.sellerName || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Email color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {seller.email || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    {seller.phone && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Phone color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Phone
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {seller.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    
                    {seller.companyName && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Business color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Company
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {seller.companyName}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {buyerHasSigned && !seller && (
              <Card sx={{ border: '1px dashed #ccc' }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Lock sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Seller information will be available after they sign the contract.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Contract Summary
                </Typography>
                
                {listing && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Product
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                      {listing.gpuModel} Server
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Quantity
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                      {contract.quantity} units
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Unit Price
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
                      ${contract.agreedPrice?.toLocaleString()}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Total Value
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      ${contract.totalValue?.toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Contract signed successfully! Seller will be notified.
                  </Alert>
                )}

                {bothHaveSigned && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Download />}
                    sx={{ mt: 2 }}
                  >
                    Download Contract PDF
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
          <DialogTitle>Confirm Signature</DialogTitle>
          <DialogContent>
            <Typography>
              By signing this contract, you agree to all terms and conditions. 
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSignContract}
              variant="contained"
              disabled={signing}
            >
              {signing ? 'Signing...' : 'Confirm & Sign'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default ContractPage;

