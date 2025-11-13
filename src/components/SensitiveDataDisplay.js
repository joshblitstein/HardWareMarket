import React, { useState } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from '@mui/material';
import { Lock } from '@mui/icons-material';

function SensitiveDataDisplay({ label, value, icon: Icon, children, onClick }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dataRevealed, setDataRevealed] = useState(false);

  const handleClick = () => {
    if (!dataRevealed) {
      setDialogOpen(true);
    } else if (onClick) {
      onClick();
    }
  };

  const handleAgree = () => {
    setDataRevealed(true);
    setDialogOpen(false);
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          p: 1.5,
          borderRadius: 1,
          border: '1px solid #e0e0e0',
          backgroundColor: dataRevealed ? 'transparent' : '#fafafa',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: dataRevealed ? '#f5f5f5' : '#f0f0f0',
            borderColor: '#bdbdbd',
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {Icon && <Icon color="action" />}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {label}
            </Typography>
            {dataRevealed ? (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {value || children}
              </Typography>
            ) : (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Lock sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.secondary', fontStyle: 'italic' }}>
                  Click to view (NDA Protected)
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Lock color="warning" />
            Non-Disclosure Agreement Reminder
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Sensitive Information Access
            </Typography>
            <Typography variant="body2">
              You are about to view sensitive data protected under the Non-Disclosure Agreement 
              (NDA) you agreed to when signing up for the Nimbus platform.
            </Typography>
          </Alert>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            By clicking "I Agree", you acknowledge and agree to:
          </Typography>
          
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>Confidentiality:</strong> This information is confidential and may only be used 
                for legitimate transactions on the Nimbus platform.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Non-Circumvention:</strong> You will not use this information to circumvent 
                the Nimbus platform or conduct transactions outside of the platform.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Data Protection:</strong> You will not share, distribute, or disclose this 
                information to third parties without explicit authorization.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Legal Obligation:</strong> Violation of the NDA may result in legal action 
                and permanent suspension from the Nimbus platform.
              </Typography>
            </li>
          </Box>

          <Alert severity="info">
            <Typography variant="body2">
              This reminder is part of the Terms of Service you accepted during signup. 
              Accessing this data constitutes your ongoing agreement to these terms.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleAgree} variant="contained" color="primary">
            I Agree & View Data
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SensitiveDataDisplay;

