import { useState, useRef } from 'react';
import { Box, IconButton, Button, Typography, useTheme, useMediaQuery } from '@mui/material';
import { X, Star, Plus, Upload, Pencil } from 'lucide-react';

interface ImageData {
  id?: string;
  preview: string;
  file?: File;
  existingUrl?: string;
  isPrimary?: boolean;
}

interface InlineImageGalleryProps {
  images: ImageData[];
  onChange: (images: ImageData[]) => void;
  onSave?: () => void;
  isEditing: boolean;
}

export const InlineImageGallery = ({ images, onChange, onSave, isEditing }: InlineImageGalleryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleAddImages = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageData[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newImages.push({
          preview,
          file,
          isPrimary: images.length === 0 && newImages.length === 0,
        });
      }
    });

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    if (newImages.length > 0 && images[index].isPrimary) {
      newImages[0].isPrimary = true;
    }
    onChange(newImages);
    if (onSave) {
      onSave();
    }
  };

  const handleSetPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(newImages);
    if (onSave) {
      onSave();
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setDraggedIndex(index);
    onChange(newImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (!isEditing) {
    return null;
  }

  const primaryImage = images.find(img => img.isPrimary) || images[0];
  const otherImages = images.filter(img => !img.isPrimary);

  const imageSize = isMobile ? 80 : 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', mb: -2 }}>
      {primaryImage && (
        <Box
          sx={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: isMobile ? 2 : 3,
            overflow: 'hidden',
            bgcolor: '#f5f5f5',
            position: 'relative',
          }}
        >
          <Box
            component="img"
            src={primaryImage.preview}
            alt="Hauptbild"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: isMobile ? 8 : 12,
              left: isMobile ? 8 : 12,
              bgcolor: 'primary.main',
              color: 'white',
              px: isMobile ? 1 : 1.5,
              py: isMobile ? 0.5 : 0.75,
              borderRadius: isMobile ? 1.5 : 2,
              fontSize: isMobile ? '0.65rem' : '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              boxShadow: 2,
            }}
          >
            <Star size={isMobile ? 12 : 14} fill="white" />
            HAUPTBILD
          </Box>
        </Box>
      )}

      <Box sx={{ bgcolor: 'white', p: isMobile ? 1.5 : 2, borderRadius: isMobile ? 2 : 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ mb: isMobile ? 1.5 : 2, fontWeight: 600, fontSize: isMobile ? '0.875rem' : '0.95rem' }}>
          Bilder verwalten
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 1 : 1.5 }}>
          {images.map((image, index) => (
          <Box
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            sx={{
              position: 'relative',
              width: imageSize,
              height: imageSize,
              borderRadius: isMobile ? 1.5 : 2,
              overflow: 'hidden',
              border: image.isPrimary ? '3px solid' : '2px solid',
              borderColor: image.isPrimary ? 'primary.main' : 'divider',
              cursor: 'move',
              transition: 'all 0.2s',
              bgcolor: '#f5f5f5',
              touchAction: 'none',
              '&:hover': {
                transform: isMobile ? 'none' : 'scale(1.05)',
                boxShadow: 2,
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
                  top: isMobile ? 4 : 6,
                  left: isMobile ? 4 : 6,
                  bgcolor: 'primary.main',
                  color: 'white',
                  px: isMobile ? 0.75 : 1,
                  py: isMobile ? 0.25 : 0.5,
                  borderRadius: 1,
                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  boxShadow: 1,
                }}
              >
                <Star size={isMobile ? 8 : 10} fill="white" />
                HAUPT
              </Box>
            )}

            <Box
              sx={{
                position: 'absolute',
                top: isMobile ? 4 : 6,
                right: isMobile ? 4 : 6,
                display: 'flex',
                gap: 0.5,
              }}
            >
              {!image.isPrimary && (
                <IconButton
                  size="small"
                  onClick={() => handleSetPrimary(index)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                    width: isMobile ? 22 : 26,
                    height: isMobile ? 22 : 26,
                    boxShadow: 1,
                    p: 0,
                  }}
                  title="Als Hauptbild setzen"
                >
                  <Star size={isMobile ? 12 : 14} />
                </IconButton>
              )}

              <IconButton
                size="small"
                onClick={() => handleRemoveImage(index)}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'white',
                  },
                  width: isMobile ? 22 : 26,
                  height: isMobile ? 22 : 26,
                  boxShadow: 1,
                  p: 0,
                }}
                title="Bild entfernen"
              >
                <X size={isMobile ? 12 : 14} />
              </IconButton>
            </Box>
          </Box>
        ))}

        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            width: imageSize,
            height: imageSize,
            borderRadius: isMobile ? 1.5 : 2,
            border: '2px dashed',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            bgcolor: 'background.default',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'rgba(25, 118, 210, 0.04)',
              borderColor: 'primary.main',
            },
          }}
        >
          <Plus size={isMobile ? 22 : 28} color="#9e9e9e" />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500, fontSize: isMobile ? '0.65rem' : '0.75rem' }}>
            Hinzufügen
          </Typography>
        </Box>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleAddImages(e.target.files)}
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, lineHeight: 1.6, fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
        • {isMobile ? 'Halte und ziehe' : 'Ziehe'} Bilder zum Umsortieren
        <br />
        • Klicke auf <Star size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> um ein Hauptbild zu wählen
      </Typography>
      </Box>
    </Box>
  );
};
