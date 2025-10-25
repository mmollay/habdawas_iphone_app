import { Box, Card, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useFilterCounts } from '../../hooks/useFilterCounts';
import { useState } from 'react';

export const FilterCountsTest = () => {
  const [testCategoryId] = useState('f5fb69d5-e054-47e8-a72e-dc05fc3620bf'); // Autos
  const { data, loading, error } = useFilterCounts(testCategoryId);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Filter-API Test
      </Typography>

      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Kategorie: <strong>Autos</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
          ID: {testCategoryId}
        </Typography>
      </Card>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {data && (
        <>
          <Card sx={{ p: 2, mb: 2, bgcolor: 'success.50' }}>
            <Typography variant="h6" gutterBottom>
              ✅ API Response Erfolgreich!
            </Typography>
            <Typography variant="body2">
              📊 Total Items: <strong>{data.total_items}</strong>
            </Typography>
            {data.price_range && (
              <Typography variant="body2">
                💰 Preis: <strong>€{data.price_range.min} - €{data.price_range.max}</strong>
              </Typography>
            )}
          </Card>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            🎯 Filter mit Counts:
          </Typography>

          {Object.entries(data.filters).map(([key, filter]) => (
            <Card key={key} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {filter.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Key: {key} | Type: {filter.type || 'text'}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {filter.values.map((val, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      p: 1,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">{val.value}</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: 'primary.main',
                        minWidth: '40px',
                        textAlign: 'right',
                      }}
                    >
                      ({val.count})
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          ))}

          <Card sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              📄 Raw JSON:
            </Typography>
            <pre style={{
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '300px',
              background: 'white',
              padding: '12px',
              borderRadius: '4px',
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </Card>
        </>
      )}
    </Box>
  );
};
