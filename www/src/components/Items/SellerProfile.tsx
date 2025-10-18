import { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, Skeleton } from '@mui/material';
import { ChevronRight, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface SellerProfileProps {
  userId: string;
  currentItemId?: string;
}

interface SellerData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  show_seller_profile: boolean;
}

interface SellerItem {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  status: string;
}

export const SellerProfile = ({ userId, currentItemId }: SellerProfileProps) => {
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [otherItems, setOtherItems] = useState<SellerItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSellerData();
  }, [userId]);

  const fetchSellerData = async () => {
    try {
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, created_at, show_seller_profile')
        .eq('id', userId)
        .single();

      if (sellerError) throw sellerError;

      setSeller(sellerData);

      if (!sellerData.show_seller_profile) {
        setLoading(false);
        return;
      }

      let itemsQuery = supabase
        .from('items')
        .select('id, title, price, image_url, status', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'published');

      if (currentItemId) {
        itemsQuery = itemsQuery.neq('id', currentItemId);
      }

      const { data: itemsData, error: itemsError, count } = await itemsQuery
        .order('created_at', { ascending: false })
        .limit(4);

      if (itemsError) throw itemsError;

      setOtherItems(itemsData || []);
      setTotalItems(count || 0);
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('de-DE', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewAllItems = () => {
    navigate(`/?seller=${userId}`);
  };

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Skeleton variant="circular" width={60} height={60} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
        </Box>
      </Box>
    );
  }

  if (!seller || !seller.show_seller_profile) {
    return (
      <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <User size={16} color="#666" />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Privater Verkäufer
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #e0e0e0' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Avatar
          src={seller.avatar_url || undefined}
          sx={{
            width: 60,
            height: 60,
            bgcolor: '#1976d2',
            fontSize: '1.25rem',
            fontWeight: 600,
          }}
        >
          {getInitials(seller.full_name)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
            {seller.full_name || 'Benutzer'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mitglied seit {getMemberSince(seller.created_at)}
          </Typography>
          {totalItems > 0 && (
            <Typography variant="body2" color="primary" fontWeight={500} sx={{ mt: 0.5 }}>
              {totalItems} {totalItems === 1 ? 'aktives Inserat' : 'aktive Inserate'}
            </Typography>
          )}
        </Box>
      </Box>

      {otherItems.length > 0 && (
        <>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
            Weitere Inserate
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              overflowX: 'auto',
              pb: 1,
              mb: 2,
              '&::-webkit-scrollbar': {
                height: 6,
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: '#ccc',
                borderRadius: 3,
              },
            }}
          >
            {otherItems.map((item) => (
              <Box
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                sx={{
                  width: 110,
                  minWidth: 110,
                  maxWidth: 110,
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: 110,
                    bgcolor: '#e0e0e0',
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    mb: 0.5,
                  }}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#f5f5f5',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Kein Bild
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8rem',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: 0.25,
                    minHeight: '2.1em',
                  }}
                >
                  {item.title}
                </Typography>
                <Typography variant="body2" fontWeight={600} color="primary" sx={{ fontSize: '0.85rem' }}>
                  {item.price.toFixed(2)} €
                </Typography>
              </Box>
            ))}
          </Box>
          <Button
            variant="outlined"
            onClick={handleViewAllItems}
            endIcon={<ChevronRight size={18} />}
            fullWidth
            sx={{
              textTransform: 'none',
              borderRadius: 1.5,
              py: 1,
            }}
          >
            Alle Inserate anzeigen
          </Button>
        </>
      )}
    </Box>
  );
};
