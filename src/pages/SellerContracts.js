import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Description,
  CheckCircle,
  Pending,
  Assignment,
} from '@mui/icons-material';

function SellerContracts() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'pending', 'signed', 'all'

  useEffect(() => {
    if (userProfile?.id) {
      fetchContracts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id]);

  const fetchContracts = async () => {
    try {
      if (!userProfile?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      let querySnapshot;
      try {
        // Try with orderBy first
        const q = query(
          collection(db, 'contracts'),
          where('sellerId', '==', userProfile.id),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        // If orderBy fails (likely due to missing index), try without it
        console.warn('orderBy failed for contracts, trying without:', error);
        const q = query(
          collection(db, 'contracts'),
          where('sellerId', '==', userProfile.id)
        );
        querySnapshot = await getDocs(q);
      }
      
      const contractsData = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          };
        })
        // Filter out cancelled or completed contracts (they should be in dep_contracts)
        .filter(contract => {
          const status = contract.status;
          // Only show active contracts: pending_buyer_signature or pending_seller_signature
          return status !== 'cancelled' && 
                 status !== 'both_signed' && 
                 status !== 'completed';
        });
      
      // Sort manually if orderBy failed
      contractsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      console.log(`Found ${contractsData.length} contracts for seller ${userProfile.id}`);
      console.log('User Profile ID:', userProfile.id);
      console.log('Contracts found:', contractsData.map(c => ({ 
        id: c.id, 
        sellerId: c.sellerId, 
        listingId: c.listingId,
        status: c.status,
        buyerSigned: !!c.buyerSignature,
        sellerSigned: !!c.sellerSignature
      })));
      
      // Debug: Log all contracts to see if sellerId matches
      if (contractsData.length === 0) {
        console.warn('No contracts found. Checking all contracts...');
        try {
          const allContractsQuery = query(collection(db, 'contracts'));
          const allContractsSnap = await getDocs(allContractsQuery);
          const allContracts = allContractsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('All contracts in database:', allContracts.map(c => ({
            id: c.id,
            sellerId: c.sellerId,
            listingId: c.listingId
          })));
        } catch (err) {
          console.error('Error fetching all contracts for debug:', err);
        }
      }
      
      setContracts(contractsData);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      console.error('User profile ID:', userProfile?.id);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (contract) => {
    const { buyerSignature, sellerSignature } = contract;
    
    if (sellerSignature) {
      return <Chip label="Completed" color="success" size="small" icon={<CheckCircle />} />;
    } else if (buyerSignature) {
      return <Chip label="Your Signature Pending" color="warning" size="small" icon={<Pending />} />;
    } else {
      return <Chip label="Waiting for Buyer" color="default" size="small" icon={<Pending />} />;
    }
  };

  const filteredContracts = contracts.filter(contract => {
    if (filter === 'pending') {
      return contract.buyerSignature && !contract.sellerSignature;
    } else if (filter === 'signed') {
      return contract.sellerSignature;
    }
    return true; // 'all'
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Contracts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage purchase contracts requiring your signature
          </Typography>
        </Box>

        {/* Filter Buttons */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant={filter === 'pending' ? 'contained' : 'outlined'}
            onClick={() => setFilter('pending')}
          >
            Pending ({contracts.filter(c => c.buyerSignature && !c.sellerSignature).length})
          </Button>
          <Button
            variant={filter === 'signed' ? 'contained' : 'outlined'}
            onClick={() => setFilter('signed')}
          >
            Completed ({contracts.filter(c => c.sellerSignature).length})
          </Button>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
          >
            All ({contracts.length})
          </Button>
        </Box>

        {/* Contracts List */}
        {filteredContracts.length > 0 ? (
          <Grid container spacing={3}>
            {filteredContracts.map((contract) => (
              <Grid item xs={12} key={contract.id}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Contract #{contract.id.substring(0, 8)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Created: {contract.createdAt?.toDate?.()?.toLocaleDateString() || 'Date not available'}
                        </Typography>
                      </Box>
                      {getStatusChip(contract)}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Product
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {contract.totalValue ? `$${contract.totalValue.toLocaleString()} Purchase` : 'Hardware Purchase'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Quantity
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {contract.quantity || 1} units
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Value
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          ${contract.totalValue?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" gap={2}>
                      <Button
                        variant="contained"
                        startIcon={<Description />}
                        onClick={() => navigate(`/seller/contracts/${contract.id}`)}
                        disabled={!contract.buyerSignature || !!contract.sellerSignature}
                      >
                        {contract.buyerSignature && !contract.sellerSignature ? 'Review & Sign' : 'View Details'}
                      </Button>
                      {contract.buyerSignature && (
                        <Chip
                          label="Buyer Signed"
                          color="success"
                          size="small"
                          icon={<CheckCircle />}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No contracts {filter === 'pending' ? 'pending your signature' : filter === 'signed' ? 'completed' : 'found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {filter === 'pending' 
                ? 'When buyers purchase your listings, contracts will appear here.'
                : 'Completed contracts will appear here after signing.'}
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
}

export default SellerContracts;

