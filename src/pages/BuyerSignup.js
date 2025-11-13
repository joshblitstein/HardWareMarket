import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

const questions = [
  { field: 'fullName', label: 'Full Name', type: 'text' },
  { field: 'workEmail', label: 'Work Email', type: 'email' },
  { field: 'companyName', label: 'Company Name', type: 'text' },
  { field: 'password', label: 'Password', type: 'password' },
  { field: 'legalCompanyName', label: 'Legal Company Name', type: 'text' },
  { field: 'countryOfRegistration', label: 'Country of Registration', type: 'text' },
  { field: 'registrationId', label: 'Registration or Tax ID', type: 'text' },
  { field: 'contactName', label: 'Primary Contact Name', type: 'text' },
  { field: 'position', label: 'Position or Title', type: 'text' },
  { field: 'workPhone', label: 'Work Phone Number', type: 'tel' },
];

function BuyerSignup() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    companyName: '',
    password: '',
    legalCompanyName: '',
    countryOfRegistration: '',
    registrationId: '',
    contactName: '',
    position: '',
    workPhone: '',
    notRestricted: false,
    agreeToTerms: false,
    businessAddress: '',
    city: '',
    state: '',
    country: '',
    registrationProof: null,
  });

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentQuestion <= questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);
      
      await signup(formData.workEmail, formData.password, {
        userType: 'buyer',
        fullName: formData.fullName,
        companyName: formData.companyName,
        legalCompanyName: formData.legalCompanyName,
        countryOfRegistration: formData.countryOfRegistration,
        registrationId: formData.registrationId,
        businessAddress: {
          address: formData.businessAddress,
          city: formData.city,
          state: formData.state,
          country: formData.country,
        },
        contactName: formData.contactName,
        position: formData.position,
        workPhone: formData.workPhone,
        notRestricted: formData.notRestricted,
        agreeToTerms: formData.agreeToTerms,
        registrationProof: formData.registrationProof?.name,
      });
      
      navigate('/login');
    } catch (error) {
      setError('Failed to create account: ' + error.message);
    }
    setLoading(false);
  };

  const renderCurrentQuestion = () => {
    const question = questions[currentQuestion];

    if (currentQuestion < questions.length) {
      return (
        <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 300,
              fontSize: '2.5rem',
              mb: 8,
              color: '#ffffff'
            }}
          >
            {currentQuestion + 1} {question.label}
          </Typography>
          
          <TextField
            autoFocus
            variant="standard"
            fullWidth
            type={question.type}
            value={formData[question.field]}
            onChange={(e) => setFormData(prev => ({ ...prev, [question.field]: e.target.value }))}
            placeholder="Type your answer here..."
            sx={{
              fontSize: '1.5rem',
              '& .MuiInput-root': {
                color: '#ffffff',
                '&::before': {
                  borderBottom: '2px solid rgba(255,255,255,0.3)'
                },
                '&::after': {
                  borderBottom: '2px solid #9F7AEA'
                }
              },
              '& input': {
                fontSize: '1.5rem',
                paddingBottom: 2,
                color: '#ffffff',
                '&::placeholder': {
                  color: 'rgba(255,255,255,0.5)'
                }
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && formData[question.field].trim()) {
                handleNext();
              }
            }}
          />
        </Box>
      );
    }

    // Special screens
    if (currentQuestion === questions.length) {
      return (
        <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 300,
              fontSize: '2.5rem',
              mb: 8,
              color: '#ffffff'
            }}
          >
            {questions.length + 1} Compliance
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.notRestricted}
                  onChange={handleInputChange('notRestricted')}
                  sx={{ 
                    '& .MuiSvgIcon-root': { fontSize: 28 },
                    color: '#ffffff',
                    '&.Mui-checked': {
                      color: '#9F7AEA'
                    }
                  }}
                />
              }
              label={<Typography sx={{ color: '#ffffff', fontSize: '1.2rem' }}>My company is not on any restricted or sanctioned list.</Typography>}
              sx={{ alignItems: 'flex-start', gap: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange('agreeToTerms')}
                  sx={{ 
                    '& .MuiSvgIcon-root': { fontSize: 28 },
                    color: '#ffffff',
                    '&.Mui-checked': {
                      color: '#9F7AEA'
                    }
                  }}
                />
              }
              label={<Typography sx={{ color: '#ffffff', fontSize: '1.2rem' }}>I agree to Nimbus Terms of Service and escrow process.</Typography>}
              sx={{ alignItems: 'flex-start', gap: 2 }}
            />
          </Box>
        </Box>
      );
    }

    if (currentQuestion === questions.length + 1) {
      return (
        <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 300,
              fontSize: '2.5rem',
              mb: 4,
              color: '#ffffff'
            }}
          >
            Almost done!
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 300, mb: 4 }}>
            Nimbus will review your submitted documents and verify your buyer profile.
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 300 }}>
            Once approved, your account will be marked as <strong style={{ color: '#9F7AEA' }}>Verified Buyer</strong> and you'll receive an email notification.
          </Typography>
          <Box sx={{ mt: 4, p: 3, backgroundColor: 'rgba(159, 122, 234, 0.1)', borderRadius: 2, border: '1px solid rgba(159, 122, 234, 0.3)' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              <strong>What's next?</strong> You'll be able to browse listings, make offers, and track deals from your buyer dashboard once verification is complete.
            </Typography>
          </Box>
        </Box>
      );
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#121212',
        position: 'relative'
      }}
    >
      {/* Progress Bar */}
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: '#2a2a2a',
          zIndex: 1000
        }}
      >
        <Box 
          sx={{ 
            height: '100%',
            background: 'linear-gradient(90deg, #5A67D8 0%, #9F7AEA 100%)',
            width: `${((currentQuestion + 1) / (questions.length + 2)) * 100}%`,
            transition: 'width 0.3s ease'
          }}
        />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8, px: 4 }}>
        {error && (
          <Alert severity="error" sx={{ position: 'absolute', top: 100, maxWidth: 600 }}>
            {error}
          </Alert>
        )}

        {renderCurrentQuestion()}
      </Box>

      {/* Navigation Buttons */}
      <Box 
        sx={{ 
          position: 'fixed',
          bottom: 40,
          right: 40,
          display: 'flex',
          gap: 2
        }}
      >
        {currentQuestion > 0 && (
          <Button
            variant="outlined"
            onClick={handleBack}
            sx={{
              borderRadius: '50px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'rgba(255,255,255,0.9)',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.5)',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={() => {
            if (currentQuestion === questions.length + 1) {
              handleSubmit();
            } else {
              handleNext();
            }
          }}
          disabled={
            loading || 
            (currentQuestion < questions.length && !formData[questions[currentQuestion].field]) ||
            (currentQuestion === questions.length && (!formData.notRestricted || !formData.agreeToTerms))
          }
          sx={{
            borderRadius: '50px',
            px: 4,
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem',
            background: 'linear-gradient(90deg, #5A67D8 0%, #9F7AEA 100%)',
            '&:hover': {
              background: 'linear-gradient(90deg, #4C51BF 0%, #805AD5 100%)',
              boxShadow: '0 8px 16px rgba(159, 122, 234, 0.3)'
            },
            '&.Mui-disabled': {
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)'
            }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'OK'}
        </Button>
      </Box>

      {/* Powered by badge */}
      <Box 
        sx={{ 
          position: 'fixed',
          bottom: 20,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
          Powered by Nimbus
        </Typography>
      </Box>
    </Box>
  );
}

export default BuyerSignup;