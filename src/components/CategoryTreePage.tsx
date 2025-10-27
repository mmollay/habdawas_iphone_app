import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  Divider,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExpandAllIcon from '@mui/icons-material/UnfoldMore';
import CollapseAllIcon from '@mui/icons-material/UnfoldLess';
import DownloadIcon from '@mui/icons-material/Download';
import CategoryTree from './Common/CategoryTree';
import { NavigationTabs } from './Common/NavigationTabs';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CategoryTreePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUsageCount, setShowUsageCount] = useState(true);
  const [expandAll, setExpandAll] = useState(false);
  const [showOnlyWithItems, setShowOnlyWithItems] = useState(false);

  const handleCategoryClick = (categorySlug: string) => {
    // Navigate to items page with category filter
    navigate(`/?categories=${categorySlug}`);
  };

  const handleExportTree = async () => {
    try {
      // Fetch all categories from database
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (!data) return;

      // Build tree structure
      const buildTree = (categories: any[]): string => {
        const categoryMap = new Map();
        categories.forEach(cat => {
          categoryMap.set(cat.id, { ...cat, children: [] });
        });

        const rootCategories: any[] = [];
        categories.forEach(cat => {
          const category = categoryMap.get(cat.id);
          if (cat.parent_id === null) {
            rootCategories.push(category);
          } else {
            const parent = categoryMap.get(cat.parent_id);
            if (parent) {
              parent.children.push(category);
            }
          }
        });

        // Generate tree text
        let treeText = 'HABDAWAS Kategorien-Struktur\\n';
        treeText += '='.repeat(50) + '\\n\\n';

        const renderCategory = (cat: any, depth: number = 0): string => {
          const indent = '  '.repeat(depth);
          const name = cat.translations?.de?.name || cat.slug;
          const levelColors = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];
          let line = `${indent}${depth === 0 ? '■ ' : '└─ '}${name} [${levelColors[cat.level - 1]}]`;

          if (cat.usage_count > 0) {
            line += ` (${cat.usage_count} Inserate)`;
          }

          line += '\\n';

          if (cat.children && cat.children.length > 0) {
            cat.children.forEach((child: any) => {
              line += renderCategory(child, depth + 1);
            });
          }

          return line;
        };

        rootCategories.forEach(cat => {
          treeText += renderCategory(cat);
          treeText += '\\n';
        });

        treeText += '\\n' + '='.repeat(50) + '\\n';
        treeText += `Gesamt: ${categories.length} Kategorien\\n`;
        treeText += `Level 1: ${categories.filter(c => c.level === 1).length} Kategorien\\n`;
        treeText += `Level 2: ${categories.filter(c => c.level === 2).length} Kategorien\\n`;
        treeText += `Level 3: ${categories.filter(c => c.level === 3).length} Kategorien\\n`;
        treeText += `Level 4: ${categories.filter(c => c.level === 4).length} Kategorien\\n`;
        treeText += `\\nExportiert am: ${new Date().toLocaleString('de-DE')}\\n`;

        return treeText;
      };

      const treeText = buildTree(data);

      // Create download
      const blob = new Blob([treeText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kategorien-struktur-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting tree:', err);
      alert('Fehler beim Exportieren der Kategorien-Struktur');
    }
  };

  return (
    <>
      {/* Navigation Tabs - Wiederverwendbare Komponente */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          mb: 0
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: '1400px !important' }}>
          <NavigationTabs
            selectedTab={0}
            showCategoryDropdown={false}
          />
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
          borderRadius: 2,
          p: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
          >
            <AccountTreeIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Kategorien
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Übersicht über alle verfügbaren Kategorien
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Controls */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Search */}
          <TextField
            fullWidth
            placeholder="Kategorien durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          <Divider />

          {/* Options */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showUsageCount}
                    onChange={(e) => setShowUsageCount(e.target.checked)}
                  />
                }
                label="Anzahl Inserate anzeigen"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyWithItems}
                    onChange={(e) => setShowOnlyWithItems(e.target.checked)}
                  />
                }
                label="Nur Kategorien mit Inseraten"
              />
            </Box>

            <Button
              variant={expandAll ? 'contained' : 'outlined'}
              startIcon={expandAll ? <CollapseAllIcon /> : <ExpandAllIcon />}
              onClick={() => setExpandAll(!expandAll)}
              size="medium"
              sx={{
                minWidth: 180,
                fontWeight: 600,
                boxShadow: expandAll ? 2 : 0
              }}
            >
              {expandAll ? 'Alle einklappen' : 'Alle ausklappen'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Category Tree */}
      <Box sx={{ mb: 4 }}>
        <CategoryTree
          searchQuery={searchQuery}
          showUsageCount={showUsageCount}
          expandAll={expandAll}
          showOnlyWithItems={showOnlyWithItems}
          onCategoryClick={handleCategoryClick}
        />
      </Box>

      {/* Info Box */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(255, 255, 255, 1) 100%)',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'primary.light'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, color: 'primary.main' }}>
          Kategorien-Legende
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#1976d2',
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Level 1</Typography>
              <Typography variant="caption" color="text.secondary">Hauptkategorie</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#388e3c',
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(56, 142, 60, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Level 2</Typography>
              <Typography variant="caption" color="text.secondary">Unterkategorie</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#f57c00',
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(245, 124, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Level 3</Typography>
              <Typography variant="caption" color="text.secondary">Detailkategorie</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#d32f2f',
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Level 4</Typography>
              <Typography variant="caption" color="text.secondary">Spezifikation</Typography>
            </Box>
          </Box>
        </Box>

        {/* Diskreter Export-Button am Ende */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="text"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportTree}
            sx={{
              fontSize: '0.75rem',
              color: 'text.disabled',
              opacity: 0.4,
              textTransform: 'none',
              '&:hover': {
                opacity: 0.8,
                color: 'primary.main',
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            Struktur exportieren
          </Button>
        </Box>
      </Paper>
      </Container>
    </>
  );
};

export default CategoryTreePage;
