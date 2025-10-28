import React from 'react';
import { Box, Typography } from '@mui/material';
import { Briefcase } from 'lucide-react';

export const JobsPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Briefcase size={64} />
      <Typography variant="h4" sx={{ mt: 2 }}>
        Jobs & Karriere
      </Typography>
      <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
        Coming soon - Dedicated job listings page
      </Typography>
    </Box>
  );
};
