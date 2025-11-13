import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Badge,
} from '@mui/material';
import { CloudUpload, Verified } from '@mui/icons-material';

const steps = [
  'Server Photos',
  'Proof of Ownership',
  'Warranty Confirmation',
  'Technical Specifications',
  'Hardware Test Reports',
  'Video Verification',
  'Review & Submit'
];

function CreateListing() {
  const [activeStep, setActiveStep] = useState(0);
  const [dealsCount, setDealsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    // Server Photos
    frontPhoto: null,
    backPhoto: null,
    serialPhoto: null,
    poweredOnPhoto: null,
    
    // Proof of Ownership
    ownershipProof: null,
    ownershipType: '',
    
    // Warranty
    warrantyDocument: null,
    warrantyStatus: '',
    
    // Technical Specs
    quantity: 1,
    chassis: '',
    gpuModel: '',
    gpuCount: '',
    cpuModel: '',
    cpuCount: '',
    ram: '',
    storage: '',
    networking: '',
    cooling: '',
    yearOfPurchase: '',
    physicalLocation: '',
    condition: '',
    conditionNote: '',
    
    // Test Reports
    nvidiaSmiReport: null,
    diagnosticsReport: null,
    benchmarkReport: null,
    
    // Video
    verificationVideo: null,
  });

  const { userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile?.id) {
      fetchDealsCount();
    }
  }, [userProfile?.id]);

  const fetchDealsCount = async () => {
    try {
      if (!userProfile?.id) return;
      
      let querySnapshot;
      try {
        const q = query(
          collection(db, 'deals'),
          where('sellerId', '==', userProfile.id),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (error) {
        // Fallback without orderBy
        const q = query(
          collection(db, 'deals'),
          where('sellerId', '==', userProfile.id)
        );
        querySnapshot = await getDocs(q);
      }
      
      setDealsCount(querySnapshot.docs.length);
    } catch (error) {
      console.error('Error fetching deals count:', error);
      setDealsCount(0);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleFileUpload = (field) => async (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const uploadFile = async (file, path) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);
      
      console.log('Starting listing submission...');
      
      // Upload all files
      const uploadPromises = [];
      const fileUrls = {};
      
      // Use a single timestamp for all files in this listing
      const listingId = `${userProfile.id}_${Date.now()}`;
      
      console.log('Uploading files with listing ID:', listingId);
      
      // Upload photos
      if (formData.frontPhoto) {
        const ext = formData.frontPhoto.name.split('.').pop();
        uploadPromises.push(
          uploadFile(formData.frontPhoto, `pending-listings/${listingId}/front.${ext}`)
            .then(url => { fileUrls.frontPhoto = url; console.log('Front photo uploaded'); })
            .catch(err => { console.error('Front photo upload failed:', err); throw err; })
        );
      }
      if (formData.backPhoto) {
        const ext = formData.backPhoto.name.split('.').pop();
        uploadPromises.push(
          uploadFile(formData.backPhoto, `pending-listings/${listingId}/back.${ext}`)
            .then(url => { fileUrls.backPhoto = url; console.log('Back photo uploaded'); })
            .catch(err => { console.error('Back photo upload failed:', err); throw err; })
        );
      }
      if (formData.serialPhoto) {
        const ext = formData.serialPhoto.name.split('.').pop();
        uploadPromises.push(
          uploadFile(formData.serialPhoto, `pending-listings/${listingId}/serial.${ext}`)
            .then(url => { fileUrls.serialPhoto = url; console.log('Serial photo uploaded'); })
            .catch(err => { console.error('Serial photo upload failed:', err); throw err; })
        );
      }
      if (formData.poweredOnPhoto) {
        const ext = formData.poweredOnPhoto.name.split('.').pop();
        uploadPromises.push(
          uploadFile(formData.poweredOnPhoto, `pending-listings/${listingId}/powered.${ext}`)
            .then(url => { fileUrls.poweredOnPhoto = url; console.log('Powered photo uploaded'); })
            .catch(err => { console.error('Powered photo upload failed:', err); throw err; })
        );
      }
      
      // Upload documents
      if (formData.ownershipProof) {
        const ext = formData.ownershipProof.name.split('.').pop();
        uploadPromises.push(
          uploadFile(formData.ownershipProof, `pending-listings/${listingId}/ownership.${ext}`)
            .then(url => { fileUrls.ownershipProof = url; console.log('Ownership doc uploaded'); })
            .catch(err => { console.error('Ownership doc upload failed:', err); throw err; })
        );
      }
      if (formData.warrantyDocument) {
        const ext = formData.warrantyDocument.name.split('.').pop();
        uploadPromises.push(
          uploadFile(formData.warrantyDocument, `pending-listings/${listingId}/warranty.${ext}`)
            .then(url => { fileUrls.warrantyDocument = url; console.log('Warranty doc uploaded'); })
            .catch(err => { console.error('Warranty doc upload failed:', err); throw err; })
        );
      }
      
      // Upload test reports
      if (formData.nvidiaSmiReport) {
        const ext = formData.nvidiaSmiReport.name.split('.').pop();
        uploadPromises.push(
          uploadFile(formData.nvidiaSmiReport, `pending-listings/${listingId}/nvidia-smi.${ext}`)
            .then(url => { fileUrls.nvidiaSmiReport = url; console.log('nvidia-smi uploaded'); })
            .catch(err => { console.error('nvidia-smi upload failed:', err); throw err; })
        );
      }
      if (formData.diagnosticsReport) {
        const ext = formData.diagnosticsReport.name.split('.').pop();
        uploadPromises.push(
          uploadFile(formData.diagnosticsReport, `pending-listings/${listingId}/diagnostics.${ext}`)
            .then(url => { fileUrls.diagnosticsReport = url; console.log('Diagnostics uploaded'); })
            .catch(err => { console.error('Diagnostics upload failed:', err); throw err; })
        );
      }
      if (formData.benchmarkReport) {
        const ext = formData.benchmarkReport.name.split('.').pop();
        uploadPromises.push(
          uploadFile(formData.benchmarkReport, `pending-listings/${listingId}/benchmark.${ext}`)
            .then(url => { fileUrls.benchmarkReport = url; console.log('Benchmark uploaded'); })
            .catch(err => { console.error('Benchmark upload failed:', err); throw err; })
        );
      }
      
      // Upload video
      if (formData.verificationVideo) {
        const ext = formData.verificationVideo.name.split('.').pop();
        uploadPromises.push(
          uploadFile(formData.verificationVideo, `pending-listings/${listingId}/verification.${ext}`)
            .then(url => { fileUrls.verificationVideo = url; console.log('Video uploaded'); })
            .catch(err => { console.error('Video upload failed:', err); throw err; })
        );
      }
      
      console.log('Waiting for all uploads to complete...');
      await Promise.all(uploadPromises);
      console.log('All uploads completed successfully');
      
      // Create listing document
      const listingData = {
        sellerId: userProfile.id,
        sellerName: userProfile.companyName,
        ...formData,
        ...fileUrls,
        status: 'pending_verification',
        createdAt: new Date(),
        submittedAt: new Date(),
        verified: false,
      };
      
      // Save to pendingListings collection for admin review
      await addDoc(collection(db, 'pendingListings'), listingData);
      
      setSuccess('Listing submitted successfully! It will be reviewed by Nimbus admin before going live on the marketplace.');
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 2000);
      
    } catch (error) {
      setError('Failed to create listing: ' + error.message);
    }
    setLoading(false);
  };

  const FileUploadButton = ({ label, onChange, accept, value }) => {
    const fileInputRef = React.useRef(null);
    
    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: '#333' }}>
          {label}
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          style={{ display: 'none' }}
        />
        <Button
          variant="outlined"
          fullWidth
          startIcon={<CloudUpload />}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            borderColor: '#e0e0e0',
            color: '#666',
            py: 1.5,
            '&:hover': {
              borderColor: '#1976d2',
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
            },
          }}
        >
          {value ? value.name : 'Choose File'}
        </Button>
        {value && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Selected: {value.name}
          </Typography>
        )}
      </Box>
    );
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Server Photos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload at least 4 clear images of your server
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FileUploadButton
                  label="Front of the server"
                  accept="image/*"
                  onChange={handleFileUpload('frontPhoto')}
                  value={formData.frontPhoto}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FileUploadButton
                  label="Back (showing ports and GPUs)"
                  accept="image/*"
                  onChange={handleFileUpload('backPhoto')}
                  value={formData.backPhoto}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FileUploadButton
                  label="Close-up of serial numbers"
                  accept="image/*"
                  onChange={handleFileUpload('serialPhoto')}
                  value={formData.serialPhoto}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FileUploadButton
                  label="Photo of server powered on"
                  accept="image/*"
                  onChange={handleFileUpload('poweredOnPhoto')}
                  value={formData.poweredOnPhoto}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Proof of Ownership
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Type of Ownership Proof</InputLabel>
                  <Select
                    value={formData.ownershipType}
                    onChange={handleInputChange('ownershipType')}
                    label="Type of Ownership Proof"
                  >
                    <MenuItem value="invoice">Original purchase invoice</MenuItem>
                    <MenuItem value="decommission">Decommission/release letter</MenuItem>
                    <MenuItem value="consignment">Reseller or consignment agreement</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FileUploadButton
                  label="Upload proof of ownership document (PDF or Image)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload('ownershipProof')}
                  value={formData.ownershipProof}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Warranty Confirmation
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Warranty Status</InputLabel>
                  <Select
                    value={formData.warrantyStatus}
                    onChange={handleInputChange('warrantyStatus')}
                    label="Warranty Status"
                  >
                    <MenuItem value="active">Active Warranty</MenuItem>
                    <MenuItem value="expired">Expired Warranty</MenuItem>
                    <MenuItem value="unknown">Unknown</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FileUploadButton
                  label="Upload warranty document (screenshot or PDF from manufacturer portal)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload('warrantyDocument')}
                  value={formData.warrantyDocument}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Technical Specifications
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange('quantity')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Chassis"
                  value={formData.chassis}
                  onChange={handleInputChange('chassis')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GPU Model (e.g., H100, H200, B200)"
                  value={formData.gpuModel}
                  onChange={handleInputChange('gpuModel')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of GPUs"
                  value={formData.gpuCount}
                  onChange={handleInputChange('gpuCount')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CPU Model"
                  value={formData.cpuModel}
                  onChange={handleInputChange('cpuModel')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CPU Count"
                  value={formData.cpuCount}
                  onChange={handleInputChange('cpuCount')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="RAM (in GB)"
                  value={formData.ram}
                  onChange={handleInputChange('ram')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Storage Size and Type"
                  value={formData.storage}
                  onChange={handleInputChange('storage')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Networking"
                  value={formData.networking}
                  onChange={handleInputChange('networking')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Cooling Method</InputLabel>
                  <Select
                    value={formData.cooling}
                    onChange={handleInputChange('cooling')}
                    label="Cooling Method"
                  >
                    <MenuItem value="air">Air Cooling</MenuItem>
                    <MenuItem value="liquid">Liquid Cooling</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Year of Purchase or Manufacture"
                  value={formData.yearOfPurchase}
                  onChange={handleInputChange('yearOfPurchase')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Physical Location (region or country)"
                  value={formData.physicalLocation}
                  onChange={handleInputChange('physicalLocation')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={formData.condition}
                    onChange={handleInputChange('condition')}
                    label="Condition"
                  >
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="used">Used</MenuItem>
                    <MenuItem value="refurbished">Refurbished</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Condition Note (optional)"
                  multiline
                  rows={3}
                  value={formData.conditionNote}
                  onChange={handleInputChange('conditionNote')}
                  placeholder="e.g., 'used for 6 months in test cluster'"
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Hardware Test Reports (Required)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
              Basic health or performance proof showing GPUs are functioning and not defective.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FileUploadButton
                  label="NVIDIA System Management Interface (nvidia-smi) output"
                  accept=".pdf,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload('nvidiaSmiReport')}
                  value={formData.nvidiaSmiReport}
                />
              </Grid>
              <Grid item xs={12}>
                <FileUploadButton
                  label="Server diagnostics screenshot (showing all GPUs detected and healthy)"
                  accept=".pdf,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload('diagnosticsReport')}
                  value={formData.diagnosticsReport}
                />
              </Grid>
              <Grid item xs={12}>
                <FileUploadButton
                  label="Benchmark or burn-in test summary (e.g., FurMark, GPU burn, or custom test logs)"
                  accept=".pdf,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload('benchmarkReport')}
                  value={formData.benchmarkReport}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Video Verification
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
              20–30 second video panning over the server, showing serials and LEDs powered on. 
              Must include timestamp with the word "Nimbus" on a piece of paper.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FileUploadButton
                  label="Upload verification video"
                  accept="video/*"
                  onChange={handleFileUpload('verificationVideo')}
                  value={formData.verificationVideo}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 6:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              Review & Submit
            </Typography>
            <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Nimbus will review your listing to confirm:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  <li style={{ marginBottom: '8px' }}>
                    <Typography variant="body2">
                      Proof of ownership and test reports confirm authenticity
                    </Typography>
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <Typography variant="body2">
                      Serial numbers are visible and consistent
                    </Typography>
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <Typography variant="body2">
                      Photos are original (not reused online)
                    </Typography>
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <Typography variant="body2">
                      Warranty and health tests match listed specs
                    </Typography>
                  </li>
                </Box>
              </CardContent>
            </Card>
            <Typography variant="body2" color="text.secondary" paragraph>
              Once verified, your listing will appear live on the marketplace with a <Verified sx={{ fontSize: 14, verticalAlign: 'middle' }} /> verified badge.
            </Typography>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* Left Sidebar */}
      <Box
        sx={{
          width: 280,
          backgroundColor: '#1a237e',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
            Nimbus
          </Typography>
        </Box>

        <Box sx={{ flex: 1, p: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, px: 2 }}>
              CREATE LISTING
            </Typography>
            <Box sx={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, p: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <Verified sx={{ mr: 2, fontSize: 20 }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  New Listing
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Seller Tools Section */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, px: 2 }}>
              SELLER TOOLS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Button
                fullWidth
                onClick={() => navigate('/seller/offers')}
                sx={{
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.5,
                  color: 'rgba(255,255,255,0.9)',
                  textTransform: 'none',
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                💰 Offers
              </Button>
              <Button
                fullWidth
                onClick={() => navigate('/seller/contracts')}
                sx={{
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.5,
                  color: 'rgba(255,255,255,0.9)',
                  textTransform: 'none',
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                📝 Contracts
              </Button>
              <Button
                fullWidth
                onClick={() => navigate('/seller/orders')}
                sx={{
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                  color: 'rgba(255,255,255,0.9)',
                  textTransform: 'none',
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  📊 Track Order Progress
                </Box>
                {dealsCount > 0 && (
                  <Badge
                    badgeContent={dealsCount}
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#42a5f5',
                        color: 'white',
                        fontWeight: 600,
                      },
                    }}
                  />
                )}
              </Button>
              <Button
                fullWidth
                onClick={() => navigate('/change-password')}
                sx={{
                  justifyContent: 'flex-start',
                  px: 2,
                  py: 1.5,
                  color: 'rgba(255,255,255,0.9)',
                  textTransform: 'none',
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                🔒 Change Password
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/seller/dashboard')}
            sx={{
              borderColor: 'rgba(255,255,255,0.5)',
              color: 'white',
              '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          marginLeft: '280px',
          backgroundColor: '#fafafa',
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Create New Listing
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Submit your AI hardware listing for review
          </Typography>

          <Paper 
            elevation={0}
            sx={{ 
              p: 4,
              borderRadius: 2,
              mb: 4,
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
            }}
          >
            <Stepper activeStep={activeStep} sx={{ mb: 5, px: 2 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel 
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.875rem',
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            <Box sx={{ mb: 4, minHeight: '400px' }}>
              {renderStepContent(activeStep)}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid #e0e0e0' }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={activeStep === 0}
                sx={{
                  minWidth: 120,
                  borderColor: '#e0e0e0',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                Back
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    minWidth: 160,
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Listing'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    minWidth: 120,
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}

export default CreateListing;
