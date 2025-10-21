import React, { useState, useRef } from 'react';
import { Paper, Typography, Box, TextField, Button, Avatar, CircularProgress, IconButton, Grid, Alert, Chip, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery, useTheme, InputAdornment } from '@mui/material';
import { AutoSaveTextField } from '../../Common/AutoSaveTextField';
import { Camera, Shield, CheckCircle, Image as ImageIcon, MoreVertical, Calendar } from 'lucide-react';
import { Profile, supabase } from '../../../lib/supabase';
import { CameraCapture } from '../../Common/CameraCapture';
import { BirthDataModal } from '../BirthDataModal';
import { calculateZodiacSign, calculateAscendant } from '../../../utils/zodiac';

interface ProfileSectionProps {
  profile: Profile | null;
  formData: {
    full_name: string;
    email: string;
    phone: string;
    bio: string;
    language: string;
    salutation: string;
    title: string;
    birth_date: string;
    birth_time: string;
    birth_place: string;
    birth_timezone: string;
  };
  onFormChange: (field: string, value: string) => void;
  userId: string;
  onProfileUpdate: () => void;
}

export const ProfileSection = ({ profile, formData, onFormChange, userId, onProfileUpdate }: ProfileSectionProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'idle' | 'code-sent' | 'verified'>('idle');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [birthDataModalOpen, setBirthDataModalOpen] = useState(false);

  // Calculate zodiac sign
  const zodiacSign = calculateZodiacSign(formData.birth_date);

  // Calculate ascendant
  const ascendant = calculateAscendant(
    formData.birth_date,
    formData.birth_time,
    formData.birth_timezone,
    formData.birth_place
  );

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFileSelect = () => {
    handleMenuClose();
    fileInputRef.current?.click();
  };

  const handleCameraOpen = () => {
    handleMenuClose();
    setShowCamera(true);
  };

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            }
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Bitte wähle eine Bilddatei aus');
      return;
    }

    setUploading(true);
    try {
      const resizedFile = await resizeImage(file);

      if (resizedFile.size > 5 * 1024 * 1024) {
        alert('Die Datei ist zu groß. Maximal 5MB erlaubt.');
        setUploading(false);
        return;
      }

      const fileExt = resizedFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, resizedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onProfileUpdate();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Fehler beim Hochladen des Bildes');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAvatarFile(file);
  };

  const handleCameraCapture = async (file: File) => {
    await uploadAvatarFile(file);
  };

  const handleRequestVerification = async () => {
    if (!formData.phone || formData.phone.trim() === '') {
      setVerificationError('Bitte gib zuerst eine Telefonnummer ein');
      return;
    }

    setVerifying(true);
    setVerificationError(null);

    try {
      const { data, error } = await supabase.rpc('request_phone_verification', {
        p_phone: formData.phone
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedCode(data.code);
        setVerificationStep('code-sent');
      } else {
        setVerificationError(data.message);
      }
    } catch (error: any) {
      console.error('Verification request error:', error);
      setVerificationError('Fehler beim Senden des Codes');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Bitte gib den 6-stelligen Code ein');
      return;
    }

    setVerifying(true);
    setVerificationError(null);

    try {
      const { data, error } = await supabase.rpc('verify_phone_code', {
        p_code: verificationCode
      });

      if (error) throw error;

      if (data.success) {
        setVerificationStep('verified');
        onProfileUpdate();
      } else {
        setVerificationError(data.message);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerificationError('Ungültiger oder abgelaufener Code');
    } finally {
      setVerifying(false);
    }
  };
  const ContentWrapper = isMobile ? Box : Paper;
  const wrapperProps = isMobile ? {} : { sx: { p: 3 } };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 1, display: { xs: 'none', md: 'block' } }}>
        Persönliche Daten
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 4 }, display: { xs: 'none', md: 'block' } }}>
        Verwalte deine persönlichen Informationen
      </Typography>

      <ContentWrapper {...wrapperProps}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 4,
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          <Box sx={{ position: 'relative', mb: { xs: 2, sm: 0 } }}>
            <Avatar
              src={profile?.avatar_url || undefined}
              sx={{
                width: 100,
                height: 100,
                fontSize: '2rem',
                bgcolor: 'primary.main'
              }}
            >
              {formData.full_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <IconButton
              onClick={handleAvatarClick}
              disabled={uploading}
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 36,
                height: 36,
              }}
            >
              {uploading ? <CircularProgress size={18} color="inherit" /> : <MoreVertical size={18} />}
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleCameraOpen}>
                <ListItemIcon>
                  <Camera size={18} />
                </ListItemIcon>
                <ListItemText>Foto aufnehmen</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleFileSelect}>
                <ListItemIcon>
                  <ImageIcon size={18} />
                </ListItemIcon>
                <ListItemText>Datei wählen</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
          <Box sx={{ ml: { sm: 3 } }}>
            <Typography variant="h6" fontWeight={600}>
              {formData.full_name || 'Kein Name'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.email}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={{ xs: 2, md: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <AutoSaveTextField
              fieldName="full_name"
              fullWidth
              label="Vollständiger Name"
              value={formData.full_name}
              onChange={(e) => onFormChange('full_name', e.target.value)}
              helperText="Dein voller Name wird anderen Nutzern angezeigt"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <AutoSaveTextField
              fieldName="title"
              fullWidth
              label="Akademischer Titel (optional)"
              value={formData.title || ''}
              onChange={(e) => onFormChange('title', e.target.value)}
              placeholder="z.B. Dr., Prof., Mag."
              helperText="Wird in E-Mail-Anreden verwendet"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <AutoSaveTextField
              fieldName="salutation"
              fullWidth
              select
              label="Anrede"
              value={formData.salutation || 'neutral'}
              onChange={(e) => onFormChange('salutation', e.target.value)}
              helperText="Wird für die korrekte Anrede in E-Mails verwendet"
              SelectProps={{
                native: true,
              }}
            >
              <option value="neutral">Neutral</option>
              <option value="mr">Herr</option>
              <option value="ms">Frau</option>
            </AutoSaveTextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="E-Mail-Adresse"
              value={formData.email}
              disabled
              helperText="Deine E-Mail-Adresse kann nicht geändert werden"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AutoSaveTextField
                  fieldName="phone"
                  fullWidth
                  label="Telefonnummer"
                  value={formData.phone}
                  onChange={(e) => onFormChange('phone', e.target.value)}
                  placeholder="+43 650 123456"
                  disabled={profile?.phone_verified || verificationStep === 'code-sent'}
                  InputProps={{
                    endAdornment: profile?.phone_verified ? (
                      <Chip
                        icon={<CheckCircle size={16} />}
                        label="Verifiziert"
                        color="success"
                        size="small"
                        sx={{ mr: -1 }}
                      />
                    ) : undefined
                  }}
                />
              </Box>

              {!profile?.phone_verified && verificationStep === 'idle' && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Shield size={18} />}
                    onClick={handleRequestVerification}
                    disabled={verifying || !formData.phone}
                    size="small"
                  >
                    {verifying ? 'Sende Code...' : 'Telefonnummer verifizieren'}
                  </Button>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Erhöhe das Vertrauen durch Verifizierung deiner Telefonnummer
                  </Typography>
                </Box>
              )}

              {verificationStep === 'code-sent' && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Demo-Modus:</strong> Der Verifizierungscode lautet: <strong>{generatedCode}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      In der Produktion würde dieser Code per SMS gesendet werden.
                    </Typography>
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      label="6-stelliger Code"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                      }}
                      placeholder="123456"
                      inputProps={{ maxLength: 6 }}
                      sx={{ width: '200px' }}
                      error={!!verificationError}
                      helperText={verificationError}
                    />
                    <Button
                      variant="contained"
                      onClick={handleVerifyCode}
                      disabled={verifying || verificationCode.length !== 6}
                    >
                      {verifying ? 'Prüfe...' : 'Verifizieren'}
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => {
                        setVerificationStep('idle');
                        setVerificationCode('');
                        setVerificationError(null);
                      }}
                    >
                      Abbrechen
                    </Button>
                  </Box>
                </Box>
              )}

              {verificationStep === 'verified' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Deine Telefonnummer wurde erfolgreich verifiziert!
                </Alert>
              )}

              {verificationError && verificationStep === 'idle' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {verificationError}
                </Alert>
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <AutoSaveTextField
              fieldName="language"
              fullWidth
              select
              label="Sprache"
              value={formData.language}
              onChange={(e) => onFormChange('language', e.target.value)}
              helperText="Bevorzugte Sprache für die App"
              SelectProps={{
                native: true,
              }}
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </AutoSaveTextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <AutoSaveTextField
              fieldName="bio"
              fullWidth
              label="Über mich"
              value={formData.bio}
              onChange={(e) => onFormChange('bio', e.target.value)}
              multiline
              rows={4}
              helperText="Erzähle anderen Nutzern etwas über dich (optional)"
              placeholder="Ich verkaufe gerne gebrauchte Artikel und bin immer auf der Suche nach guten Deals..."
            />
          </Grid>

          {/* Birth Data Section for Astrology */}
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                mt: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Geburtsdaten für Inserate-Optimierung (Experimentell)
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setBirthDataModalOpen(true)}
                  startIcon={<Calendar size={16} />}
                >
                  {formData.birth_date ? 'Bearbeiten' : 'Hinzufügen'}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: formData.birth_date ? 1 : 0 }}>
                Optional: Diese Daten werden verwendet um deine Inserate besser auf dein Profil abzustimmen.
                Sie sind nicht öffentlich sichtbar.
              </Typography>
              {formData.birth_date && (
                <>
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Geburtsdatum
                      </Typography>
                      <Typography variant="body2">
                        {new Date(formData.birth_date + 'T00:00:00').toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </Typography>
                    </Box>
                    {formData.birth_time && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Geburtszeit
                        </Typography>
                        <Typography variant="body2">{formData.birth_time} Uhr</Typography>
                      </Box>
                    )}
                    {formData.birth_place && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Geburtsort
                        </Typography>
                        <Typography variant="body2">{formData.birth_place}</Typography>
                      </Box>
                    )}
                  </Box>

                  {zodiacSign && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          fontSize: '2rem',
                          lineHeight: 1,
                        }}
                      >
                        {zodiacSign.symbol}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {zodiacSign.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {zodiacSign.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={zodiacSign.element === 'fire' ? 'Feuer' : zodiacSign.element === 'earth' ? 'Erde' : zodiacSign.element === 'air' ? 'Luft' : 'Wasser'}
                        size="small"
                        sx={{
                          bgcolor: zodiacSign.color + '20',
                          color: zodiacSign.color,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  )}

                  {ascendant && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          fontSize: '2rem',
                          lineHeight: 1,
                        }}
                      >
                        {ascendant.symbol}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Aszendent: {ascendant.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ascendant.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={ascendant.element === 'fire' ? 'Feuer' : ascendant.element === 'earth' ? 'Erde' : ascendant.element === 'air' ? 'Luft' : 'Wasser'}
                        size="small"
                        sx={{
                          bgcolor: ascendant.color + '20',
                          color: ascendant.color,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Grid>
        </Grid>

      </ContentWrapper>

      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />

      <BirthDataModal
        open={birthDataModalOpen}
        onClose={() => setBirthDataModalOpen(false)}
        userId={userId}
        currentData={{
          birth_date: formData.birth_date || '',
          birth_time: formData.birth_time || '',
          birth_place: formData.birth_place || '',
          birth_timezone: formData.birth_timezone || '',
        }}
        onSave={() => {
          onProfileUpdate();
          setBirthDataModalOpen(false);
        }}
      />
    </Box>
  );
};
