import { useState, useRef, DragEvent } from 'react';
import { Box, IconButton, Typography, Paper, Button, useMediaQuery, useTheme } from '@mui/material';
import { Camera, X, Star, Image as ImageIcon, FolderOpen } from 'lucide-react';

interface ImageFile {
  file?: File;
  preview: string;
  id: string;
  isPrimary: boolean;
  existingUrl?: string;
}

interface MultiImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
}

export const MultiImageUpload = ({
  images,
  onImagesChange,
  maxImages = 10
}: MultiImageUploadProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = [];
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newImage: ImageFile = {
            file,
            preview: reader.result as string,
            id: `${Date.now()}-${i}`,
            isPrimary: images.length === 0 && newImages.length === 0,
          };
          newImages.push(newImage);

          if (newImages.length === filesToProcess) {
            onImagesChange([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);

    if (updatedImages.length > 0) {
      const removedWasPrimary = images.find(img => img.id === id)?.isPrimary;
      if (removedWasPrimary) {
        updatedImages[0].isPrimary = true;
      }
    }

    onImagesChange(updatedImages);
  };

  const setPrimaryImage = (id: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === id,
    }));
    onImagesChange(updatedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onImagesChange(updatedImages);
  };

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    moveImage(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  if (images.length === 0) {
    return (
      <Box>
        <Paper
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          elevation={0}
          sx={{
            width: '100%',
            minHeight: { xs: 400, sm: 360 },
            borderRadius: 4,
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : '#e0e0e0',
            bgcolor: dragOver ? 'rgba(25, 118, 210, 0.04)' : '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            gap: { xs: 3, sm: 3.5 },
            py: { xs: 4, sm: 5 },
            px: { xs: 3, sm: 4 },
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: dragOver
                ? 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                : 'transparent',
              transition: 'all 0.3s ease',
            }
          }}
        >
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              bgcolor: dragOver ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              transform: dragOver ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <ImageIcon size={48} color={dragOver ? '#1976d2' : '#9e9e9e'} strokeWidth={1.5} />
          </Box>

          <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
            <Typography
              variant="h5"
              color="text.primary"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                letterSpacing: '-0.02em'
              }}
            >
              Fotos hinzufügen
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 0.75,
                fontSize: { xs: '0.9375rem', sm: '1rem' },
                lineHeight: 1.6,
                fontWeight: 400
              }}
            >
              Wähle wie du Bilder hinzufügen möchtest
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(0, 0, 0, 0.5)',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Bis zu {maxImages} Bilder
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto',
              maxWidth: isMobile ? '100%' : 500,
            }}
          >
            {isMobile && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Camera size={22} strokeWidth={2} />}
                onClick={() => cameraInputRef.current?.click()}
                sx={{
                  flex: 1,
                  py: 1.75,
                  px: 4,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: '#10b981',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#059669',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                    transform: 'translateY(-1px)'
                  },
                  '&:active': {
                    transform: 'translateY(0)'
                  }
                }}
              >
                Kamera
              </Button>
            )}
            <Button
              variant={isMobile ? 'outlined' : 'contained'}
              size="large"
              startIcon={<FolderOpen size={22} strokeWidth={2} />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                flex: 1,
                py: { xs: 1.75, sm: 2 },
                px: 4,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.0625rem' },
                fontWeight: 600,
                ...(isMobile ? {
                  borderWidth: '2px',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderWidth: '2px',
                    borderColor: 'primary.dark',
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)'
                  },
                } : {
                  bgcolor: 'primary.main',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.35)',
                    transform: 'translateY(-1px)'
                  },
                }),
                transition: 'all 0.2s ease',
                '&:active': {
                  transform: 'translateY(0)'
                }
              }}
            >
              {isMobile ? 'Galerie' : 'Bilder auswählen'}
            </Button>
          </Box>

          {!isMobile && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mt: 0.5
              }}
            >
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                oder per Drag & Drop
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>
          )}
        </Paper>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{
        display: 'flex',
        gap: 1.5,
        flexWrap: 'wrap',
      }}>
        {images.map((image, index) => (
          <Box
            key={image.id}
            draggable
            onDragStart={(e) => handleImageDragStart(e, index)}
            onDragOver={(e) => handleImageDragOver(e, index)}
            onDragEnd={handleImageDragEnd}
            sx={{
              position: 'relative',
              width: 120,
              height: 120,
              borderRadius: 3,
              overflow: 'hidden',
              cursor: 'grab',
              opacity: draggedIndex === index ? 0.5 : 1,
              transition: 'opacity 0.2s',
              border: image.isPrimary ? '3px solid' : '1px solid',
              borderColor: image.isPrimary ? 'primary.main' : 'divider',
              '&:active': {
                cursor: 'grabbing',
              },
            }}
          >
            <Box
              component="img"
              src={image.preview}
              alt={`Bild ${index + 1}`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {image.isPrimary && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderRadius: 1.5,
                  px: 1,
                  py: 0.25,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Star size={12} fill="currentColor" />
                Hauptbild
              </Box>
            )}

            <IconButton
              size="small"
              onClick={() => removeImage(image.id)}
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                width: 28,
                height: 28,
                '&:hover': {
                  bgcolor: 'error.main',
                  color: 'white',
                },
              }}
            >
              <X size={16} />
            </IconButton>

            {!image.isPrimary && (
              <Box
                onClick={() => setPrimaryImage(image.id)}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  py: 0.5,
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.85)',
                  },
                }}
              >
                <Star size={12} />
                Als Hauptbild
              </Box>
            )}
          </Box>
        ))}

        {images.length < maxImages && (
          <Paper
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            sx={{
              width: 120,
              height: 120,
              borderRadius: 3,
              border: '2px dashed',
              borderColor: dragOver ? 'primary.main' : 'divider',
              bgcolor: dragOver ? 'action.hover' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              gap: 0.5,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <Camera size={28} color="#999" />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              Bild hinzufügen
            </Typography>
          </Paper>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />
      </Box>

      {images.length > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1.5, display: 'block' }}
        >
          {images.length} von {maxImages} Bildern
        </Typography>
      )}
    </Box>
  );
};
