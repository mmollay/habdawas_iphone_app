import React from 'react';
import { Box, Typography } from '@mui/material';
import { Home } from 'lucide-react';

export const PropertiesPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Home size={64} />
      <Typography variant="h4" sx={{ mt: 2 }}>
        Immobilien
      </Typography>
      <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
        Coming soon - Dedicated property listings page
      </Typography>
    </Box>
  );
};
