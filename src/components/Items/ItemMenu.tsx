import { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { Pencil, Pause, Play, CheckCircle, Archive, Trash2, RotateCcw, Copy } from 'lucide-react';
import { Item, supabase } from '../../lib/supabase';

interface ItemMenuProps {
  item: Item;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: (e?: React.MouseEvent) => void;
  onEdit: () => void;
  onItemUpdated?: (itemId?: string) => void;
}

export const ItemMenu = ({ item, anchorEl, open, onClose, onEdit, onItemUpdated }: ItemMenuProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleStatusChange = async (newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();

    try {
      const { error } = await supabase
        .from('items')
        .update({ status: newStatus })
        .eq('id', item.id);

      if (error) throw error;
      onItemUpdated?.();
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      // Immediately notify parent to remove item from UI
      const itemId = item.id;
      onItemUpdated?.(itemId);

      // Delete images from storage in background
      if (item.image_url) {
        const imagePaths = [item.image_url, ...(item.additional_images || [])];
        for (const imagePath of imagePaths) {
          const fileName = imagePath.split('/').pop();
          if (fileName) {
            try {
              await supabase.storage.from('items').remove([fileName]);
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          }
        }
      }

      // Delete item from database
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();

    try {
      const { data: itemData, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('id', item.id)
        .single();

      if (fetchError) throw fetchError;

      const { id, created_at, updated_at, views, ...itemWithoutMeta } = itemData;

      const newItem = {
        ...itemWithoutMeta,
        title: `${itemData.title} (Kopie)`,
        status: 'draft',
      };

      const { error: insertError } = await supabase
        .from('items')
        .insert([newItem]);

      if (insertError) throw insertError;
      onItemUpdated?.();
    } catch (error) {
      console.error('Error duplicating item:', error);
    }
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {item.status !== 'archived' && (
          <MenuItem onClick={(e) => { e.stopPropagation(); onClose(e); onEdit(); }}>
            <ListItemIcon><Pencil size={18} /></ListItemIcon>
            <ListItemText>Bearbeiten</ListItemText>
          </MenuItem>
        )}
        {item.status === 'draft' && (
          <>
            <MenuItem onClick={(e) => handleStatusChange('published', e)}>
              <ListItemIcon><Play size={18} /></ListItemIcon>
              <ListItemText>Live schalten</ListItemText>
            </MenuItem>
            <MenuItem onClick={(e) => handleStatusChange('paused', e)}>
              <ListItemIcon><Pause size={18} /></ListItemIcon>
              <ListItemText>Auf Pause setzen</ListItemText>
            </MenuItem>
          </>
        )}
        {item.status === 'published' && (
          <MenuItem onClick={(e) => handleStatusChange('paused', e)}>
            <ListItemIcon><Pause size={18} /></ListItemIcon>
            <ListItemText>Pausieren</ListItemText>
          </MenuItem>
        )}
        {(item.status === 'paused' || item.status === 'expired') && (
          <MenuItem onClick={(e) => handleStatusChange('published', e)}>
            <ListItemIcon><Play size={18} /></ListItemIcon>
            <ListItemText>Aktivieren</ListItemText>
          </MenuItem>
        )}
        {item.status === 'published' && (
          <MenuItem onClick={(e) => handleStatusChange('sold', e)}>
            <ListItemIcon><CheckCircle size={18} /></ListItemIcon>
            <ListItemText>Als verkauft markieren</ListItemText>
          </MenuItem>
        )}
        {item.status === 'archived' && (
          <>
            <MenuItem onClick={(e) => handleStatusChange('draft', e)}>
              <ListItemIcon><RotateCcw size={18} /></ListItemIcon>
              <ListItemText>Wiederherstellen</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDuplicate}>
              <ListItemIcon><Copy size={18} /></ListItemIcon>
              <ListItemText>Duplizieren</ListItemText>
            </MenuItem>
          </>
        )}
        {item.status !== 'archived' && (
          <MenuItem onClick={(e) => handleStatusChange('archived', e)}>
            <ListItemIcon><Archive size={18} /></ListItemIcon>
            <ListItemText>Archivieren</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={(e) => { e.stopPropagation(); onClose(e); setDeleteDialogOpen(true); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Trash2 size={18} color="#d32f2f" /></ListItemIcon>
          <ListItemText>Löschen</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onClick={(e) => e.stopPropagation()}>
        <DialogTitle>Inserat löschen?</DialogTitle>
        <DialogContent>
          <Typography>
            Möchtest du dieses Inserat wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(false); }}>
            Abbrechen
          </Button>
          <Button onClick={(e) => { e.stopPropagation(); handleDelete(); setDeleteDialogOpen(false); }} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
