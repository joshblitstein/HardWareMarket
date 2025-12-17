import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import { CheckCircle, Cancel, Visibility, People, Inventory } from '@mui/icons-material';

function AdminDashboard() {
  const { userProfile } = useAuth();
  const [pendingListings, setPendingListings] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [viewUserDialog, setViewUserDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (userProfile && userProfile.userType === 'admin') {
      const loadData = async () => {
        await Promise.all([
          fetchPendingListings(),
          fetchPendingUsers()
        ]);
      };
      loadData();
    }
  }, [userProfile]);

  const fetchPendingListings = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'pendingListings'));
      const listings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by creation date, newest first
      listings.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setPendingListings(listings);
      console.log('Fetched pending listings:', listings.length);
    } catch (error) {
      console.error('Error fetching pending listings:', error);
      setError('Failed to fetch pending listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      // Get all users and filter for unverified ones (verified === false or undefined)
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = allUsersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for users that are not verified (verified === false or verified is undefined)
      // Also exclude admin users from pending list
      const unverifiedUsers = allUsers.filter(user => 
        user.userType !== 'admin' && (user.verified === false || user.verified === undefined)
      );
      
      // Sort by creation date, newest first
      unverifiedUsers.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
      
      setPendingUsers(unverifiedUsers);
      console.log('Fetched pending users:', unverifiedUsers.length);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setError('Failed to fetch pending users: ' + error.message);
    }
  };

  const handleApprove = async (listing) => {
    try {
      setActionLoading(true);
      
      // Create the approved listing for the main listings collection
      const approvedListing = {
        ...listing,
        verified: true,
        status: 'active',
        approvedAt: new Date(),
        approvedBy: userProfile.id,
        // Preserve createdAt from original submission, or set it if missing
        createdAt: listing.createdAt || listing.submittedAt || new Date(),
        // Set publishedAt as when it went live (same as approvedAt)
        publishedAt: new Date(),
        // Ensure sellerId is preserved (critical for contracts)
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
      };
      
      console.log('Approving listing - sellerId:', listing.sellerId);
      console.log('Approved listing sellerId:', approvedListing.sellerId);
      
      // Remove the pendingListings id and add to listings collection
      const { id, ...listingData } = approvedListing;
      await addDoc(collection(db, 'listings'), listingData);
      
      // Delete from pendingListings
      await deleteDoc(doc(db, 'pendingListings', listing.id));
      
      // Refresh the list
      await fetchPendingListings();
      setViewDialog(false);
      setSelectedListing(null);
    } catch (error) {
      console.error('Error approving listing:', error);
      setError('Failed to approve listing: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (listing) => {
    try {
      setActionLoading(true);
      
      // Delete from pendingListings
      await deleteDoc(doc(db, 'pendingListings', listing.id));
      
      // Refresh the list
      await fetchPendingListings();
      setViewDialog(false);
      setSelectedListing(null);
    } catch (error) {
      console.error('Error rejecting listing:', error);
      setError('Failed to reject listing: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveUser = async (user) => {
    try {
      setActionLoading(true);
      
      // Update user to verified
      await updateDoc(doc(db, 'users', user.id), {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: userProfile.id,
      });
      
      // Refresh the list
      await fetchPendingUsers();
      setViewUserDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Failed to approve user: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectUser = async (user) => {
    try {
      setActionLoading(true);
      
      // Delete user from database
      await deleteDoc(doc(db, 'users', user.id));
      
      // Refresh the list
      await fetchPendingUsers();
      setViewUserDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('Failed to reject user: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Review and approve pending listings and users
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Tabs - Always visible */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              icon={<Inventory />} 
              iconPosition="start" 
              label={`Pending Listings (${pendingListings.length})`} 
            />
            <Tab 
              icon={<People />} 
              iconPosition="start" 
              label={`Pending Users (${pendingUsers.length})`} 
            />
          </Tabs>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Pending Listings Tab */}
        {activeTab === 0 && (
          <>

            {pendingListings.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No pending listings to review
                </Typography>
              </Paper>
            ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Seller</strong></TableCell>
                  <TableCell><strong>GPU Model</strong></TableCell>
                  <TableCell><strong>Chassis</strong></TableCell>
                  <TableCell><strong>Condition</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell><strong>Submitted</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingListings.map((listing) => {
                  const submittedDate = listing.createdAt?.toDate ? listing.createdAt.toDate() : new Date(listing.createdAt);
                  
                  return (
                    <TableRow key={listing.id} hover>
                      <TableCell>{listing.sellerName || 'Unknown'}</TableCell>
                      <TableCell>
                        <Chip label={listing.gpuModel || 'N/A'} size="small" color="primary" />
                      </TableCell>
                      <TableCell>{listing.chassis || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={listing.condition || 'Unknown'} 
                          size="small"
                          color={listing.condition === 'new' ? 'success' : listing.condition === 'used' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{listing.physicalLocation || 'N/A'}</TableCell>
                      <TableCell>
                        {submittedDate.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => {
                              setSelectedListing(listing);
                              setViewDialog(true);
                            }}
                          >
                            View
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
            )}
          </>
        )}

        {/* Pending Users Tab */}
        {activeTab === 1 && (
          <>
            {pendingUsers.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No pending users to review
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Name/Company</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>User Type</strong></TableCell>
                      <TableCell><strong>Country</strong></TableCell>
                      <TableCell><strong>Registered</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingUsers.map((user) => {
                      const registeredDate = user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
                      
                      return (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            {user.fullName || user.companyName || 'N/A'}
                          </TableCell>
                          <TableCell>{user.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.userType || 'N/A'} 
                              size="small" 
                              color={user.userType === 'buyer' ? 'primary' : user.userType === 'seller' ? 'secondary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {user.countryOfRegistration || user.businessAddress?.country || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {registeredDate.toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setViewUserDialog(true);
                                }}
                              >
                                View
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Container>

      {/* View Listing Dialog */}
      <Dialog 
        open={viewDialog} 
        onClose={() => {
          setViewDialog(false);
          setSelectedListing(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Review Listing Details
        </DialogTitle>
        <DialogContent>
          {selectedListing && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                Seller Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Seller:</strong> {selectedListing.sellerName}
              </Typography>

              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                Technical Specifications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>GPU Model:</strong> {selectedListing.gpuModel || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>GPU Count:</strong> {selectedListing.gpuCount || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>CPU Model:</strong> {selectedListing.cpuModel || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>CPU Count:</strong> {selectedListing.cpuCount || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>RAM:</strong> {selectedListing.ram || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Storage:</strong> {selectedListing.storage || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Chassis:</strong> {selectedListing.chassis || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Condition:</strong> {selectedListing.condition || 'N/A'}</Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                Additional Information
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Location:</strong> {selectedListing.physicalLocation || 'N/A'}<br />
                <strong>Year of Purchase:</strong> {selectedListing.yearOfPurchase || 'N/A'}<br />
                {selectedListing.conditionNote && (
                  <>
                    <strong>Condition Note:</strong> {selectedListing.conditionNote}
                  </>
                )}
              </Typography>

              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                Uploaded Documents
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedListing.frontPhoto && (
                  <Chip label="Front Photo" size="small" sx={{ width: 'fit-content' }} />
                )}
                {selectedListing.backPhoto && (
                  <Chip label="Back Photo" size="small" sx={{ width: 'fit-content' }} />
                )}
                {selectedListing.serialPhoto && (
                  <Chip label="Serial Numbers" size="small" sx={{ width: 'fit-content' }} />
                )}
                {selectedListing.ownershipProof && (
                  <Chip label="Ownership Proof" size="small" color="primary" sx={{ width: 'fit-content' }} />
                )}
                {selectedListing.warrantyDocument && (
                  <Chip label="Warranty Document" size="small" color="primary" sx={{ width: 'fit-content' }} />
                )}
                {selectedListing.nvidiaSmiReport && (
                  <Chip label="NVIDIA SMI Report" size="small" color="secondary" sx={{ width: 'fit-content' }} />
                )}
                {selectedListing.verificationVideo && (
                  <Chip label="Verification Video" size="small" color="secondary" sx={{ width: 'fit-content' }} />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setViewDialog(false);
              setSelectedListing(null);
            }}
          >
            Close
          </Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => handleReject(selectedListing)}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
          <Button
            color="success"
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={() => handleApprove(selectedListing)}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog 
        open={viewUserDialog} 
        onClose={() => {
          setViewUserDialog(false);
          setSelectedUser(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Review User Details
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Email:</strong> {selectedUser.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>User Type:</strong> {selectedUser.userType || 'N/A'}</Typography>
                </Grid>
                {selectedUser.fullName && (
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Full Name:</strong> {selectedUser.fullName}</Typography>
                  </Grid>
                )}
                {selectedUser.companyName && (
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Company Name:</strong> {selectedUser.companyName}</Typography>
                  </Grid>
                )}
                {selectedUser.legalCompanyName && (
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Legal Company Name:</strong> {selectedUser.legalCompanyName}</Typography>
                  </Grid>
                )}
                {selectedUser.countryOfRegistration && (
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Country of Registration:</strong> {selectedUser.countryOfRegistration}</Typography>
                  </Grid>
                )}
                {selectedUser.registrationId && (
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Registration ID:</strong> {selectedUser.registrationId}</Typography>
                  </Grid>
                )}
              </Grid>

              {selectedUser.businessAddress && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                    Business Address
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.businessAddress.address && <><strong>Address:</strong> {selectedUser.businessAddress.address}<br /></>}
                    {selectedUser.businessAddress.city && <><strong>City:</strong> {selectedUser.businessAddress.city}<br /></>}
                    {selectedUser.businessAddress.state && <><strong>State:</strong> {selectedUser.businessAddress.state}<br /></>}
                    {selectedUser.businessAddress.country && <><strong>Country:</strong> {selectedUser.businessAddress.country}</>}
                  </Typography>
                </>
              )}

              {selectedUser.contactName && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                    Contact Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Contact Name:</strong> {selectedUser.contactName}<br />
                    {selectedUser.position && <><strong>Position:</strong> {selectedUser.position}<br /></>}
                    {selectedUser.workPhone && <><strong>Work Phone:</strong> {selectedUser.workPhone}</>}
                  </Typography>
                </>
              )}

              {selectedUser.bankingDetails && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                    Banking Details (Seller Only)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Bank Name:</strong> {selectedUser.bankingDetails.bankName || 'N/A'}<br />
                    <strong>Account Number:</strong> {selectedUser.bankingDetails.accountNumber ? '***' + selectedUser.bankingDetails.accountNumber.slice(-4) : 'N/A'}<br />
                    <strong>Swift/BIC:</strong> {selectedUser.bankingDetails.swiftBic || 'N/A'}
                  </Typography>
                </>
              )}

              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                Registration Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Created At:</strong> {selectedUser.createdAt?.toDate ? selectedUser.createdAt.toDate().toLocaleString() : 'N/A'}<br />
                <strong>Verified:</strong> {selectedUser.verified ? 'Yes' : 'No'}<br />
                <strong>Active:</strong> {selectedUser.isActive ? 'Yes' : 'No'}
              </Typography>

              {selectedUser.registrationProof && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
                    Uploaded Documents
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedUser.registrationProof && (
                      <Chip label="Registration Proof" size="small" sx={{ width: 'fit-content' }} />
                    )}
                    {selectedUser.incorporationProof && (
                      <Chip label="Incorporation Proof" size="small" sx={{ width: 'fit-content' }} />
                    )}
                    {selectedUser.representativeId && (
                      <Chip label="Representative ID" size="small" sx={{ width: 'fit-content' }} />
                    )}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setViewUserDialog(false);
              setSelectedUser(null);
            }}
          >
            Close
          </Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => handleRejectUser(selectedUser)}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
          <Button
            color="success"
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={() => handleApproveUser(selectedUser)}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;

