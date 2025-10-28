import React from 'react';
import { Box, Typography } from '@mui/material';
import { Car } from 'lucide-react';

export const VehiclesPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Car size={64} />
      <Typography variant="h4" sx={{ mt: 2 }}>
        Fahrzeuge
      </Typography>
      <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
        Coming soon - Dedicated vehicle listings page
      </Typography>
    </Box>
  );
};
