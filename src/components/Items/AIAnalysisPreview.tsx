import { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Alert,
  Paper,
  IconButton,
  Collapse,
} from '@mui/material';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Star } from 'lucide-react';

interface AnalysisResult {
  title: string;
  description: string;
  price: number;
  category?: string;
  subcategory?: string;
  condition?: string;
  brand?: string;
  features?: string[];
  accessories?: string[];
  tags?: string[];
  colors?: string[];
  [key: string]: any;
}

interface ScoredAnalysis {
  analysis: AnalysisResult;
  score: number;
  index: number;
  isDocument: boolean;
}

interface AIAnalysisPreviewProps {
  analyses: AnalysisResult[];
  scoredAnalyses: ScoredAnalysis[];
  mergedAnalysis: AnalysisResult;
  categoryInfo?: {
    level1?: string;
    level2?: string;
    level3?: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export const AIAnalysisPreview = ({
  analyses,
  scoredAnalyses,
  mergedAnalysis,
  categoryInfo,
  onConfirm,
  onCancel,
}: AIAnalysisPreviewProps) => {
  const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);
  const [showMerged, setShowMerged] = useState(true);

  const bestAnalysis = scoredAnalyses[0];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        🤖 AI-Analyse Ergebnisse
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {analyses.length} Bilder analysiert - Überprüfe die Ergebnisse vor dem Speichern
      </Typography>

      {/* Merged Result (Final) */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.50', border: '2px solid', borderColor: 'success.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle size={24} color="green" />
            <Typography variant="h6">Finales Ergebnis (wird gespeichert)</Typography>
          </Box>
          <IconButton onClick={() => setShowMerged(!showMerged)} size="small">
            {showMerged ? <ChevronUp /> : <ChevronDown />}
          </IconButton>
        </Box>

        <Collapse in={showMerged}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Titel</Typography>
              <Typography variant="h6">{mergedAnalysis.title}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Preis</Typography>
              <Typography variant="h6">€ {mergedAnalysis.price}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Kategorie</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {categoryInfo?.level1 && <Chip label={categoryInfo.level1} size="small" color="primary" />}
                {categoryInfo?.level2 && <Chip label={categoryInfo.level2} size="small" color="primary" variant="outlined" />}
                {categoryInfo?.level3 && <Chip label={categoryInfo.level3} size="small" />}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Beschreibung</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', maxHeight: 200, overflow: 'auto' }}>
                {mergedAnalysis.description}
              </Typography>
            </Grid>

            {mergedAnalysis.brand && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Marke</Typography>
                <Chip label={mergedAnalysis.brand} size="small" />
              </Grid>
            )}

            {mergedAnalysis.condition && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Zustand</Typography>
                <Chip label={mergedAnalysis.condition} size="small" />
              </Grid>
            )}

            {mergedAnalysis.features && mergedAnalysis.features.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Features ({mergedAnalysis.features.length})</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {mergedAnalysis.features.map((f, i) => (
                    <Chip key={i} label={f} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
            )}

            {mergedAnalysis.colors && mergedAnalysis.colors.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Farben</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {mergedAnalysis.colors.map((c, i) => (
                    <Chip key={i} label={c} size="small" />
                  ))}
                </Box>
              </Grid>
            )}

            {mergedAnalysis.tags && mergedAnalysis.tags.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Tags ({mergedAnalysis.tags.length})</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxHeight: 100, overflow: 'auto' }}>
                  {mergedAnalysis.tags.slice(0, 15).map((t, i) => (
                    <Chip key={i} label={t} size="small" variant="outlined" color="secondary" />
                  ))}
                  {mergedAnalysis.tags.length > 15 && (
                    <Chip label={`+${mergedAnalysis.tags.length - 15} mehr`} size="small" variant="outlined" />
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </Collapse>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Individual Analyses with Scores */}
      <Typography variant="h6" gutterBottom>
        🎯 Analyse-Scores (Bild für Bild)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Höchster Score = Beste Analyse (wird als Basis verwendet)
      </Typography>

      <Grid container spacing={2}>
        {scoredAnalyses.map((scored, idx) => {
          const isBest = idx === 0;
          const isExpanded = expandedAnalysis === idx;

          return (
            <Grid item xs={12} key={idx}>
              <Card
                sx={{
                  border: isBest ? '2px solid' : '1px solid',
                  borderColor: isBest ? 'success.main' : 'divider',
                  bgcolor: isBest ? 'success.50' : 'background.paper',
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isBest && <Star size={20} fill="gold" color="gold" />}
                      <Typography variant="subtitle1" fontWeight={isBest ? 700 : 400}>
                        Bild {scored.index + 1}: {scored.analysis.title.substring(0, 50)}...
                      </Typography>
                    </Box>
                    <IconButton onClick={() => setExpandedAnalysis(isExpanded ? null : idx)} size="small">
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip
                      label={`Score: ${scored.score}`}
                      size="small"
                      color={isBest ? 'success' : 'default'}
                      variant={isBest ? 'filled' : 'outlined'}
                    />
                    <Chip
                      label={`€ ${scored.analysis.price}`}
                      size="small"
                      variant="outlined"
                    />
                    {scored.isDocument && (
                      <Chip
                        label="📄 Dokument"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                    {scored.analysis.brand && (
                      <Chip label={scored.analysis.brand} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Collapse in={isExpanded}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Beschreibung:</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                        {scored.analysis.description?.substring(0, 300)}
                        {scored.analysis.description && scored.analysis.description.length > 300 ? '...' : ''}
                      </Typography>

                      {scored.analysis.features && scored.analysis.features.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2"><strong>Features:</strong></Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            {scored.analysis.features.map((f, i) => (
                              <Chip key={i} label={f} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          size="large"
          startIcon={<XCircle />}
          onClick={onCancel}
        >
          Abbrechen
        </Button>
        <Button
          variant="contained"
          size="large"
          startIcon={<CheckCircle />}
          onClick={onConfirm}
          color="success"
        >
          Bestätigen & Speichern
        </Button>
      </Box>
    </Box>
  );
};
