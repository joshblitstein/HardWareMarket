import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Download,
  Person,
  Email,
  Phone,
  Business,
} from '@mui/icons-material';

function SellerContractDetail() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [contract, setContract] = useState(null);
  const [listing, setListing] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!userProfile || userProfile.userType !== 'seller') {
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
      
      // Verify this contract belongs to the current seller
      if (contractData.sellerId !== userProfile.id) {
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
        
        // If both parties have already signed but listing status is not 'sold', update it and move contract
        if (contractData.buyerSignature && contractData.sellerSignature && listingSnap.exists()) {
          const listingData = listingSnap.data();
          if (listingData.status !== 'sold') {
            console.log('⚠️ Both parties signed but listing not marked as sold. Updating...');
            try {
              await updateDoc(listingRef, {
                status: 'sold',
                soldAt: new Date(),
                contractId: contractData.id,
                updatedAt: new Date(),
              });
              console.log('✅ Listing marked as sold:', contractData.listingId);
              
              // Create deal if it doesn't exist
              const dealsQuery = query(
                collection(db, 'deals'),
                where('contractId', '==', contractData.id)
              );
              const dealsSnap = await getDocs(dealsQuery);
              if (dealsSnap.empty) {
                console.log('⚠️ Deal not found, creating it...');
                const dealRef = await addDoc(collection(db, 'deals'), {
                  buyerId: contractData.buyerId,
                  sellerId: contractData.sellerId,
                  listingId: contractData.listingId,
                  contractId: contractData.id,
                  gpuModel: listingData.gpuModel || 'N/A',
                  quantity: contractData.quantity,
                  agreedPrice: contractData.agreedPrice,
                  totalValue: contractData.totalValue,
                  status: 'in_progress',
                  currentStep: 'payment',
                  complianceStatus: 'pending',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
                // Update listing with dealId
                await updateDoc(listingRef, {
                  dealId: dealRef.id,
                });
                console.log('✅ Deal created:', dealRef.id);
              }
              
              // Move completed contract to dep_contracts
              const contractRefForDep = doc(db, 'contracts', contractData.id);
              const finalContractSnap = await getDoc(contractRefForDep);
              if (finalContractSnap.exists()) {
                const finalContractData = finalContractSnap.data();
                const depContractRef = doc(db, 'dep_contracts', contractData.id);
                await setDoc(depContractRef, {
                  ...finalContractData,
                  status: 'both_signed',
                  deprecatedAt: new Date(),
                  deprecatedReason: 'completed',
                });
                await deleteDoc(contractRefForDep);
                console.log('✅ Completed contract moved to dep_contracts:', contractData.id);
              }
            } catch (error) {
              console.error('❌ Error updating listing status in fetch:', error);
            }
          } else {
            // Listing is sold, check if contract should be moved to dep_contracts
            const contractRefCheck = doc(db, 'contracts', contractData.id);
            const contractExists = await getDoc(contractRefCheck);
            if (contractExists.exists()) {
              try {
                const finalContractData = contractExists.data();
                const depContractRef = doc(db, 'dep_contracts', contractData.id);
                await setDoc(depContractRef, {
                  ...finalContractData,
                  status: 'both_signed',
                  deprecatedAt: new Date(),
                  deprecatedReason: 'completed',
                });
                await deleteDoc(contractRefCheck);
                console.log('✅ Completed contract moved to dep_contracts:', contractData.id);
              } catch (depError) {
                console.error('❌ Error moving contract to dep_contracts:', depError);
              }
            }
          }
        }
      }

      // Fetch buyer information (always visible to seller)
      if (contractData.buyerId) {
        const buyerRef = doc(db, 'users', contractData.buyerId);
        const buyerSnap = await getDoc(buyerRef);
        if (buyerSnap.exists()) {
          setBuyer({ id: buyerSnap.id, ...buyerSnap.data() });
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
        sellerSignature: {
          data: signature,
          signedAt: new Date(),
          ipAddress: ipAddress,
          userAgent: userAgent,
        },
        sellerSignedAt: new Date(),
        completedAt: new Date(),
        status: 'both_signed',
      });

      // Create deal after both parties sign
      let dealId = null;
      try {
        const dealRef = await addDoc(collection(db, 'deals'), {
          buyerId: contract.buyerId,
          sellerId: contract.sellerId,
          listingId: contract.listingId,
          contractId: contract.id,
          gpuModel: listing?.gpuModel || 'N/A',
          quantity: contract.quantity,
          agreedPrice: contract.agreedPrice,
          totalValue: contract.totalValue,
          status: 'in_progress',
          currentStep: 'payment',
          complianceStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        dealId = dealRef.id;
        console.log('Deal created with ID:', dealId);
      } catch (dealError) {
        console.error('Error creating deal:', dealError);
        throw dealError; // Re-throw so we don't delete listing if deal creation fails
      }

      // Update listing status to 'sold' instead of deleting (keep for history)
      if (contract.listingId) {
        try {
          const listingRef = doc(db, 'listings', contract.listingId);
          const listingSnap = await getDoc(listingRef);
          
          if (listingSnap.exists()) {
            await updateDoc(listingRef, {
              status: 'sold',
              soldAt: new Date(),
              contractId: contract.id,
              dealId: dealId,
              updatedAt: new Date(),
            });
            console.log('✅ Listing marked as sold:', contract.listingId);
          } else {
            console.warn('⚠️ Listing not found:', contract.listingId);
          }
        } catch (updateError) {
          console.error('❌ Error updating listing status:', updateError);
          console.error('Listing ID:', contract.listingId);
        }
      } else {
        console.warn('⚠️ No listingId found in contract:', contract.id);
      }

      // Move completed contract to dep_contracts
      try {
        const contractRef = doc(db, 'contracts', contractId);
        const contractSnap = await getDoc(contractRef);
        
        if (contractSnap.exists()) {
          const finalContractData = contractSnap.data();
          
          // Move to dep_contracts
          const depContractRef = doc(db, 'dep_contracts', contractId);
          await setDoc(depContractRef, {
            ...finalContractData,
            status: 'both_signed',
            deprecatedAt: new Date(),
            deprecatedReason: 'completed',
          });
          
          // Delete from contracts collection
          await deleteDoc(contractRef);
          console.log('✅ Completed contract moved to dep_contracts:', contractId);
        }
      } catch (depError) {
        console.error('❌ Error moving contract to dep_contracts:', depError);
        // Don't throw - deal is created, contract archiving failure is not critical
      }

      setSuccess(true);
      setConfirmDialogOpen(false);
      
      // Navigate back to contracts list since contract is archived
      navigate('/seller/contracts');
    } catch (err) {
      console.error('Error signing contract:', err);
      setError('Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this contract? This action cannot be undone. The listing will be made available again in the marketplace.')) {
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
        deprecatedReason: 'seller_declined',
      });
      
      // Delete from contracts collection
      await deleteDoc(contractRef);
      console.log('✅ Contract moved to dep_contracts:', contractId);
      
      // Restore listing status to 'active' so it appears in marketplace again
      if (contract?.listingId) {
        try {
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
        } catch (listingError) {
          console.error('❌ Error restoring listing:', listingError);
          // Don't throw - contract is moved, listing update failure is not critical
        }
      }
      
      navigate('/seller/contracts');
    } catch (err) {
      console.error('Error declining contract:', err);
      setError('Failed to decline contract. Please try again.');
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
        <Button sx={{ mt: 2 }} onClick={() => navigate('/seller/contracts')}>
          Back to Contracts
        </Button>
      </Container>
    );
  }

  if (!contract) return null;

  const buyerHasSigned = !!contract.buyerSignature;
  const sellerHasSigned = !!contract.sellerSignature;
  const bothHaveSigned = buyerHasSigned && sellerHasSigned;

  return (
    <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Box mb={4}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/seller/contracts')} sx={{ mb: 2 }}>
            Back to Contracts
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
                buyerHasSigned ? 'Your Signature Pending' :
                'Waiting for Buyer'
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
                    p: 0,
                    backgroundColor: '#fafafa',
                    maxHeight: '500px',
                    overflow: 'hidden',
                    mb: 3,
                    border: '1px solid #e0e0e0',
                    position: 'relative',
                  }}
                >
                  {/* PDF Viewer Mock */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '500px',
                      backgroundColor: '#525252',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                    }}
                  >
                    {/* PDF Toolbar */}
                    <Box
                      sx={{
                        height: '40px',
                        backgroundColor: '#424242',
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        borderBottom: '1px solid #616161',
                      }}
                    >
                      <Box
                        sx={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#ff5f57',
                          mr: 1,
                        }}
                      />
                      <Box
                        sx={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#ffbd2e',
                          mr: 1,
                        }}
                      />
                      <Box
                        sx={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#28ca42',
                        }}
                      />
                      <Box sx={{ flex: 1 }} />
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        contract.pdf
                      </Typography>
                    </Box>
                    
                    {/* PDF Content Area */}
                    <Box
                      sx={{
                        flex: 1,
                        backgroundColor: '#f5f5f5',
                        overflowY: 'auto',
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        p: 2,
                      }}
                    >
                      {/* Mock PDF Page */}
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: '816px', // Standard US Letter width in px at 96 DPI
                          minHeight: '1056px', // Standard US Letter height
                          backgroundColor: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          p: 4,
                          fontFamily: 'serif',
                          fontSize: '12px',
                          lineHeight: 1.6,
                          color: '#333',
                        }}
                      >
                        {/* PDF Header */}
                        <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #000', pb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px', mb: 1 }}>
                            PURCHASE AGREEMENT
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '11px', color: '#666' }}>
                            Contract ID: {contractId.substring(0, 8)}...
                          </Typography>
                        </Box>

                        {/* Contract Content */}
                        <Box sx={{ mb: 3 }}>
                          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '13px' }}>
                            PARTIES
                          </Typography>
                          <Typography sx={{ mb: 2, fontSize: '12px' }}>
                            This Purchase Agreement ("Agreement") is entered into between {buyer?.companyName || buyer?.name || 'Buyer'} ("Buyer") 
                            and {contract.sellerName || 'Seller'} ("Seller") on {new Date(contract.createdAt?.toDate?.() || contract.createdAt || Date.now()).toLocaleDateString()}.
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '13px' }}>
                            PRODUCT DETAILS
                          </Typography>
                          <Typography sx={{ mb: 1, fontSize: '12px' }}>
                            <strong>Product:</strong> {listing?.gpuModel || 'GPU'} Server
                          </Typography>
                          <Typography sx={{ mb: 1, fontSize: '12px' }}>
                            <strong>Quantity:</strong> {contract.quantity} unit(s)
                          </Typography>
                          <Typography sx={{ mb: 1, fontSize: '12px' }}>
                            <strong>Unit Price:</strong> ${contract.agreedPrice?.toLocaleString() || '0'}
                          </Typography>
                          <Typography sx={{ mb: 2, fontSize: '12px' }}>
                            <strong>Total Value:</strong> ${contract.totalValue?.toLocaleString() || '0'}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                          <Typography sx={{ fontWeight: 600, mb: 1, fontSize: '13px' }}>
                            TERMS AND CONDITIONS
                          </Typography>
                          <Typography sx={{ mb: 1, fontSize: '12px', textAlign: 'justify' }}>
                            1. The Seller agrees to deliver the product in the condition specified in the listing.
                          </Typography>
                          <Typography sx={{ mb: 1, fontSize: '12px', textAlign: 'justify' }}>
                            2. Payment shall be made through the platform's escrow system upon completion of verification.
                          </Typography>
                          <Typography sx={{ mb: 1, fontSize: '12px', textAlign: 'justify' }}>
                            3. The Buyer agrees to complete payment within the timeframe specified in the contract terms.
                          </Typography>
                          <Typography sx={{ mb: 1, fontSize: '12px', textAlign: 'justify' }}>
                            4. Both parties agree to comply with all applicable laws and regulations.
                          </Typography>
                          <Typography sx={{ mb: 2, fontSize: '12px', textAlign: 'justify' }}>
                            5. This agreement is binding upon electronic signature by both parties.
                          </Typography>
                        </Box>

                        {/* Signatures Section */}
                        <Box sx={{ mt: 6, borderTop: '1px solid #ccc', pt: 3 }}>
                          <Grid container spacing={4}>
                            <Grid item xs={6}>
                              <Box sx={{ borderBottom: '1px solid #000', mb: 1, pb: 0.5, minHeight: '40px' }}>
                                {contract.buyerSignature && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <img
                                      src={contract.buyerSignature.data}
                                      alt="Buyer Signature"
                                      style={{ maxHeight: '30px', maxWidth: '150px' }}
                                    />
                                  </Box>
                                )}
                              </Box>
                              <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
                                Buyer Signature
                              </Typography>
                              <Typography sx={{ fontSize: '10px', color: '#666', mt: 0.5 }}>
                                {buyer?.companyName || buyer?.name || 'Buyer'}
                              </Typography>
                              {contract.buyerSignedAt && (
                                <Typography sx={{ fontSize: '10px', color: '#666' }}>
                                  {new Date(contract.buyerSignedAt?.toDate?.() || contract.buyerSignedAt).toLocaleDateString()}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ borderBottom: '1px solid #000', mb: 1, pb: 0.5, minHeight: '40px' }}>
                                {contract.sellerSignature && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <img
                                      src={contract.sellerSignature.data}
                                      alt="Seller Signature"
                                      style={{ maxHeight: '30px', maxWidth: '150px' }}
                                    />
                                  </Box>
                                )}
                              </Box>
                              <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
                                Seller Signature
                              </Typography>
                              <Typography sx={{ fontSize: '10px', color: '#666', mt: 0.5 }}>
                                {contract.sellerName || 'Seller'}
                              </Typography>
                              {contract.sellerSignedAt && (
                                <Typography sx={{ fontSize: '10px', color: '#666' }}>
                                  {new Date(contract.sellerSignedAt?.toDate?.() || contract.sellerSignedAt).toLocaleDateString()}
                                </Typography>
                              )}
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Paper>

                {buyerHasSigned && !sellerHasSigned && (
                  <Box>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      ✓ Buyer has signed this contract. Your signature is required to complete the transaction.
                    </Alert>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Your Signature Required
                    </Typography>
                    <SignaturePad onSave={handleSignatureSave} />
                  </Box>
                )}

                {!buyerHasSigned && (
                  <Alert severity="warning" sx={{ mt: 3 }}>
                    Waiting for buyer to sign the contract. You will be able to sign once the buyer has signed.
                  </Alert>
                )}

                {bothHaveSigned && (
                  <Alert severity="success" sx={{ mt: 3 }}>
                    ✓ Contract completed! Both parties have signed. A deal has been created.
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Buyer Information - Always visible to seller */}
            {buyer && (
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Buyer Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <Person color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Buyer Name
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {buyer.companyName || buyer.name || buyer.email || 'N/A'}
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
                            {buyer.email || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    {buyer.phone && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Phone color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Phone
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {buyer.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    
                    {buyer.companyName && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Business color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Company
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {buyer.companyName}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
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
                    Contract signed successfully! Deal has been created.
                  </Alert>
                )}

                {buyerHasSigned && !sellerHasSigned && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={handleDecline}
                      sx={{ mb: 1 }}
                    >
                      Decline Contract
                    </Button>
                  </Box>
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
              This action cannot be undone. A deal will be created automatically upon signing.
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

export default SellerContractDetail;

