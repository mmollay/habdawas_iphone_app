import { useState } from 'react';
import { Box, Card, Typography, Button, Chip, Stack } from '@mui/material';
import { SlidersHorizontal } from 'lucide-react';
import { AdvancedFilterSidebar, SelectedFilters } from '../Items/AdvancedFilterSidebar';

export const AdvancedFilterSidebarTest = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});

  // Test mit Autos-Kategorie
  const testCategoryId = 'f5fb69d5-e054-47e8-a72e-dc05fc3620bf';

  const handleFilterChange = (filters: SelectedFilters) => {
    setSelectedFilters(filters);
    console.log('Selected Filters:', filters);
  };

  const getFilterSummary = () => {
    const summary: string[] = [];

    Object.entries(selectedFilters).forEach(([key, values]) => {
      if (key === 'priceRange') {
        const [min, max] = values as [number, number];
        summary.push(`Preis: €${min} - €${max}`);
      } else if (Array.isArray(values) && values.length > 0) {
        summary.push(`${key}: ${values.join(', ')}`);
      }
    });

    return summary;
  };

  const filterSummary = getFilterSummary();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Advanced Filter Sidebar Test
      </Typography>

      <Card sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Kategorie: <strong>Autos</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace', mb: 2 }}>
          ID: {testCategoryId}
        </Typography>

        <Button
          variant="contained"
          startIcon={<SlidersHorizontal size={20} />}
          onClick={() => setFilterOpen(true)}
          size="large"
        >
          Filter öffnen
        </Button>
      </Card>

      {filterSummary.length > 0 && (
        <Card sx={{ p: 2, mb: 3, bgcolor: 'success.50' }}>
          <Typography variant="h6" gutterBottom>
            ✅ Aktive Filter ({filterSummary.length})
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            {filterSummary.map((filter, idx) => (
              <Chip
                key={idx}
                label={filter}
                color="primary"
                size="small"
              />
            ))}
          </Stack>
        </Card>
      )}

      {filterSummary.length === 0 && (
        <Card sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            ℹ️ Keine Filter ausgewählt. Klicke auf "Filter öffnen" um Filter auszuwählen.
          </Typography>
        </Card>
      )}

      <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom>
          📄 Selected Filters (JSON):
        </Typography>
        <pre style={{
          fontSize: '0.75rem',
          overflow: 'auto',
          maxHeight: '300px',
          background: 'white',
          padding: '12px',
          borderRadius: '4px',
        }}>
          {JSON.stringify(selectedFilters, null, 2)}
        </pre>
      </Card>

      <AdvancedFilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categoryId={testCategoryId}
        onFilterChange={handleFilterChange}
        selectedFilters={selectedFilters}
      />
    </Box>
  );
};
