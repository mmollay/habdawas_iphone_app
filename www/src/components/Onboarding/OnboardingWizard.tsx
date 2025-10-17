import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  useMediaQuery,
  useTheme,
  Autocomplete,
} from '@mui/material';
import { CheckCircle, User, MapPin, Settings, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { countries } from '../../data/countries';
import { getDefaultCountry } from '../../utils/countryUtils';
import { CameraCapture } from '../Common/CameraCapture';

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const steps = ['Profil', 'Adresse', 'Einstellungen'];

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    phone_country: getDefaultCountry(),
    country: getDefaultCountry(),
    avatar_url: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);

  const [addressData, setAddressData] = useState({
    address: '',
    postal_code: '',
    city: '',
    country: getDefaultCountry(),
    phone: '',
  });

  const [preferencesData, setPreferencesData] = useState({
    pickup_enabled: true,
    shipping_enabled: false,
    show_location_to_public: true,
  });

  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadUserData();
    }
  }, [open, user]);

  useEffect(() => {
    const fetchCities = async () => {
      if (addressData.postal_code.length >= 4) {
        setLoadingCities(true);
        try {
          const { searchCitiesByPostalCode } = await import('../../utils/postalCodeLookup');
          const suggestions = await searchCitiesByPostalCode(addressData.postal_code, addressData.country);
          const cities = suggestions.map(s => s.city);
          console.log('Found cities for', addressData.postal_code, ':', cities);
          setCitySuggestions(cities);

          if (cities.length === 1 && !addressData.city) {
            setAddressData(prev => ({ ...prev, city: cities[0] }));
          }
        } catch (error) {
          console.error('Error fetching cities:', error);
        } finally {
          setLoadingCities(false);
        }
      } else {
        setCitySuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchCities, 500);
    return () => clearTimeout(timeoutId);
  }, [addressData.postal_code, addressData.country]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const firstInput = document.querySelector<HTMLInputElement>('input:not([disabled]):not([type="hidden"])');
        if (firstInput) {
          firstInput.focus();
        }
      }, 300);
    }
  }, [open, activeStep]);

  const loadUserData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      const phoneData = parsePhone(profile.phone || '');
      const userCountry = profile.country || getDefaultCountry();

      setProfileData({
        full_name: profile.full_name || '',
        phone: phoneData.number,
        phone_country: phoneData.country,
        country: userCountry,
        avatar_url: profile.avatar_url || '',
      });
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }

      const { data: defaultAddress } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (defaultAddress) {
        setAddressData({
          address: defaultAddress.address || '',
          postal_code: defaultAddress.postal_code || '',
          city: defaultAddress.city || '',
          country: defaultAddress.country || userCountry,
          phone: defaultAddress.phone || '',
        });
      } else {
        setAddressData({
          address: '',
          postal_code: '',
          city: '',
          country: userCountry,
          phone: '',
        });
      }

      setPreferencesData({
        pickup_enabled: profile.pickup_enabled ?? true,
        shipping_enabled: profile.shipping_enabled ?? false,
        show_location_to_public: profile.show_location_to_public ?? true,
      });
    }
  };

  const parsePhone = (fullPhone: string) => {
    if (!fullPhone) return { country: getDefaultCountry(), number: '' };

    const country = countries.find(c => fullPhone.startsWith(c.dialCode));
    if (country) {
      return {
        country: country.code,
        number: fullPhone.substring(country.dialCode.length).trim(),
      };
    }
    return { country: getDefaultCountry(), number: fullPhone };
  };

  const validatePhone = (country: string, phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '');

    if (!/^\d+$/.test(cleaned)) {
      return false;
    }

    const minLength: { [key: string]: number } = {
      'DE': 6, 'AT': 6, 'CH': 6, 'IT': 8, 'FR': 9,
      'ES': 9, 'NL': 9, 'BE': 8, 'PL': 9, 'CZ': 9,
      'SK': 9, 'HU': 8, 'SI': 8, 'HR': 8, 'GB': 10,
    };

    const maxLength: { [key: string]: number } = {
      'DE': 13, 'AT': 13, 'CH': 12, 'IT': 11, 'FR': 10,
      'ES': 9, 'NL': 9, 'BE': 9, 'PL': 9, 'CZ': 9,
      'SK': 9, 'HU': 9, 'SI': 9, 'HR': 9, 'GB': 10,
    };

    const min = minLength[country] || 6;
    const max = maxLength[country] || 15;

    return cleaned.length >= min && cleaned.length <= max;
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

  const handleAvatarFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Bitte nur Bilddateien hochladen.');
      return;
    }

    const resizedFile = await resizeImage(file);

    if (resizedFile.size > 5 * 1024 * 1024) {
      setError('Datei ist zu groß. Maximal 5 MB erlaubt.');
      return;
    }

    setAvatarFile(resizedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(resizedFile);
    setError(null);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAvatarFile(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    handleAvatarFile(file);
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!profileData.full_name.trim()) {
        setError('Bitte geben Sie Ihren Namen ein');
        return false;
      }
      if (!profileData.phone.trim()) {
        setError('Bitte geben Sie Ihre Telefonnummer ein');
        return false;
      }
      if (!validatePhone(profileData.phone_country, profileData.phone)) {
        setError('Bitte geben Sie eine gültige Telefonnummer ein');
        return false;
      }
    }
    if (activeStep === 1) {
      if (!addressData.address.trim()) {
        setError('Bitte geben Sie Ihre Adresse ein');
        return false;
      }
      if (!addressData.postal_code.trim()) {
        setError('Bitte geben Sie Ihre Postleitzahl ein');
        return false;
      }
      if (!addressData.city.trim()) {
        setError('Bitte geben Sie Ihre Stadt ein');
        return false;
      }
    }
    return true;
  };

  const saveStep = async () => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      if (activeStep === 0) {
        const selectedCountry = countries.find(c => c.code === profileData.phone_country);
        const fullPhone = selectedCountry
          ? `${selectedCountry.dialCode} ${profileData.phone.trim()}`
          : profileData.phone.trim();

        let avatarUrl = profileData.avatar_url;

        if (avatarFile) {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('item-images')
            .upload(fileName, avatarFile);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('item-images')
            .getPublicUrl(fileName);

          avatarUrl = publicUrl;
        }

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email || '',
            full_name: profileData.full_name,
            phone: fullPhone,
            country: profileData.country,
            avatar_url: avatarUrl,
          }, {
            onConflict: 'id'
          });

        if (upsertError) throw upsertError;

        setAddressData(prev => ({
          ...prev,
          country: profileData.country,
        }));
      } else if (activeStep === 1) {
        const { data: existingAddress } = await supabase
          .from('addresses')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();

        if (existingAddress) {
          const { error: addressError } = await supabase
            .from('addresses')
            .update({
              address: addressData.address,
              postal_code: addressData.postal_code,
              city: addressData.city,
              country: addressData.country,
              phone: addressData.phone || null,
            })
            .eq('id', existingAddress.id);

          if (addressError) throw addressError;
        } else {
          const { error: addressError } = await supabase
            .from('addresses')
            .insert({
              user_id: user.id,
              address: addressData.address,
              postal_code: addressData.postal_code,
              city: addressData.city,
              country: addressData.country,
              phone: addressData.phone || null,
              is_default: true,
              address_type: 'both',
            });

          if (addressError) throw addressError;
        }
      } else if (activeStep === 2) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email || '',
            pickup_enabled: preferencesData.pickup_enabled,
            shipping_enabled: preferencesData.shipping_enabled,
            show_location_to_public: preferencesData.show_location_to_public,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });

        if (upsertError) throw upsertError;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    const success = await saveStep();
    if (!success) return;

    if (activeStep === steps.length - 1) {
      onComplete();
    } else {
      setActiveStep((prev) => prev + 1);
      setError(null);
      setTimeout(() => {
        const firstInput = document.querySelector<HTMLInputElement>('input:not([disabled])');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError(null);
  };

  const getStepIcon = (step: number) => {
    if (step === 0) return <User size={24} />;
    if (step === 1) return <MapPin size={24} />;
    return <Settings size={24} />;
  };

  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          p: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogContent sx={{ px: isMobile ? 2 : 4, py: isMobile ? 2 : 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            component="img"
            src="/logo.png"
            alt="HABDAWAS Logo"
            sx={{
              width: 'auto',
              height: 40,
              mb: 3,
              mx: 'auto',
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 500, mb: 1, color: 'text.primary' }}>
            Willkommen
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            Richten Sie Ihr Profil in wenigen Schritten ein
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              mb: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: '#10b981',
              },
            }}
          />
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  icon={
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          index <= activeStep ? '#10b981' : 'rgba(0, 0, 0, 0.1)',
                        color: index <= activeStep ? 'white' : 'text.secondary',
                      }}
                    >
                      {getStepIcon(index)}
                    </Box>
                  }
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 500, fontSize: '1.1rem' }}>
              Profil-Informationen
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Diese Informationen helfen anderen Nutzern, Sie zu kontaktieren
            </Typography>

            <Box
              sx={{
                mb: 3,
                p: 3,
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: avatarPreview ? '#10b981' : 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {avatarPreview ? (
                    <Box
                      component="img"
                      src={avatarPreview}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={40} color="#999" />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Profilbild (optional)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Ein Profilbild erhöht das Vertrauen und die Transparenz erheblich. Es hilft anderen Nutzern, Sie als echte Person zu erkennen.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Camera size={16} />}
                      onClick={() => setShowCamera(true)}
                      sx={{
                        textTransform: 'none',
                        borderColor: '#10b981',
                        color: '#10b981',
                        '&:hover': {
                          borderColor: '#059669',
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        },
                      }}
                    >
                      Foto aufnehmen
                    </Button>
                    <Button
                      component="label"
                      variant="outlined"
                      size="small"
                      startIcon={<ImageIcon size={16} />}
                      sx={{
                        textTransform: 'none',
                        borderColor: '#10b981',
                        color: '#10b981',
                        '&:hover': {
                          borderColor: '#059669',
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        },
                      }}
                    >
                      Datei wählen
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </Button>
                  </Box>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                Verifizierung und Echtheit sind unsere höchsten Prioritäten. Ein Profilbild trägt maßgeblich zur Vertrauensbildung bei.
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Vollständiger Name"
              value={profileData.full_name}
              onChange={(e) =>
                setProfileData({ ...profileData, full_name: e.target.value })
              }
              sx={{ mb: 2 }}
              required
              autoFocus
            />

            <Autocomplete
              fullWidth
              options={countries}
              value={countries.find(c => c.code === profileData.country) || null}
              onChange={(_, newValue) => {
                if (newValue) {
                  setProfileData({
                    ...profileData,
                    country: newValue.code,
                    phone_country: newValue.code,
                  });
                }
              }}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => (
                <li {...props}>
                  <span style={{ marginRight: 8 }}>{option.flag}</span>
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Land"
                  required
                  helperText="Ihr Hauptland für Profil und Verkaufsort"
                />
              )}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Vorwahl"
                value={profileData.phone_country}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone_country: e.target.value })
                }
                sx={{ width: '140px' }}
                required
              >
                {countries.map((country) => (
                  <MenuItem key={country.code} value={country.code}>
                    {country.flag} {country.dialCode}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Telefonnummer"
                value={profileData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9\s-]/g, '');
                  setProfileData({ ...profileData, phone: value });
                }}
                placeholder="123 456789"
                required
                helperText={profileData.phone ? (
                  validatePhone(profileData.phone_country, profileData.phone)
                    ? ''
                    : 'Ungültige Telefonnummer'
                ) : ''}
                error={profileData.phone.length > 0 && !validatePhone(profileData.phone_country, profileData.phone)}
              />
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 500, fontSize: '1.1rem' }}>
              Abholort / Verkaufsort
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Dies ist Ihr Hauptstandort für Abholungen und Versand
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block', fontStyle: 'italic' }}>
              Sie können später in den Einstellungen weitere Verkaufsorte hinzufügen
            </Typography>

            <Autocomplete
              fullWidth
              options={countries}
              value={countries.find(c => c.code === addressData.country) || null}
              onChange={(_, newValue) => {
                if (newValue) {
                  setAddressData({ ...addressData, country: newValue.code });
                }
              }}
              getOptionLabel={(option) => option.name}
              renderOption={(props, option) => (
                <li {...props}>
                  <span style={{ marginRight: 8 }}>{option.flag}</span>
                  {option.name}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Land"
                  required
                  helperText="Kann vom Profilland abweichen"
                />
              )}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Straße und Hausnummer"
              value={addressData.address}
              onChange={(e) =>
                setAddressData({ ...addressData, address: e.target.value })
              }
              sx={{ mb: 2 }}
              required
              autoFocus
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Postleitzahl"
                value={addressData.postal_code}
                onChange={(e) =>
                  setAddressData({ ...addressData, postal_code: e.target.value })
                }
                sx={{ width: '120px' }}
                required
                helperText={loadingCities ? 'Suche...' : ''}
              />
              <Autocomplete
                fullWidth
                freeSolo
                options={citySuggestions}
                value={addressData.city}
                onInputChange={(e, value) =>
                  setAddressData({ ...addressData, city: value })
                }
                loading={loadingCities}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Stadt"
                    required
                  />
                )}
              />
            </Box>
            <TextField
              fullWidth
              label="Telefonnummer für diesen Standort (optional)"
              value={addressData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9\s+()-]/g, '');
                setAddressData({ ...addressData, phone: value });
              }}
              placeholder="+43 123 456789 oder +49 123 456789"
              helperText="Nur angeben, wenn abweichend vom Profiltelefon"
              sx={{ mb: 2 }}
            />
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 500, fontSize: '1.1rem' }}>
              Verkaufseinstellungen
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Legen Sie fest, wie Sie Ihre Artikel verkaufen möchten
            </Typography>
            <Box
              sx={{
                p: 3,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
                mb: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={preferencesData.pickup_enabled}
                    onChange={(e) =>
                      setPreferencesData({
                        ...preferencesData,
                        pickup_enabled: e.target.checked,
                      })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Abholung ermöglichen
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Käufer können Artikel bei Ihnen abholen
                    </Typography>
                  </Box>
                }
              />
            </Box>
            <Box
              sx={{
                p: 3,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
                mb: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={preferencesData.shipping_enabled}
                    onChange={(e) =>
                      setPreferencesData({
                        ...preferencesData,
                        shipping_enabled: e.target.checked,
                      })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Versand ermöglichen
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sie versenden Artikel an Käufer
                    </Typography>
                  </Box>
                }
              />
            </Box>
            <Box
              sx={{
                p: 3,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={preferencesData.show_location_to_public}
                    onChange={(e) =>
                      setPreferencesData({
                        ...preferencesData,
                        show_location_to_public: e.target.checked,
                      })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Standort öffentlich zeigen
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ihre Stadt wird in Ihren Inseraten angezeigt
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {activeStep === steps.length - 1 && (
              <Box
                sx={{
                  mt: 3,
                  p: { xs: 2, sm: 3 },
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <CheckCircle
                    size={32}
                    style={{ color: '#10b981' }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                  Fast geschafft!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                  Klicke auf "Fertig", um mit dem Verkaufen zu beginnen
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ flex: 1 }}
          >
            Zurück
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            sx={{
              flex: 1,
              backgroundColor: '#10b981',
              '&:hover': {
                backgroundColor: '#059669',
              },
            }}
          >
            {loading
              ? 'Speichern...'
              : activeStep === steps.length - 1
              ? 'Fertig'
              : 'Weiter'}
          </Button>
        </Box>
      </DialogContent>

      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </Dialog>
  );
}
