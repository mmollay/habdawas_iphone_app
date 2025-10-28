import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, TextField, InputAdornment, useMediaQuery, useTheme, Badge, Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Tooltip } from '@mui/material';
import { MessageCircle, User, LogIn, LogOut, Search, Heart, Share2, X, Settings, Camera, List, FileText, Info, Coins, Shield, CheckCircle, Store, Crown, Award, Sparkles, Users, TrendingUp, Calendar, FolderTree, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { useCreditsStats } from '../../hooks/useCreditsStats';
import { useUserStatus } from '../../hooks/useUserStatus';
import { useCreditCheck } from '../../hooks/useCreditCheck';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { SearchAutocomplete } from '../Common/SearchAutocomplete';
import { supabase, Profile } from '../../lib/supabase';

interface HeaderProps {
  onNavigate: (page: 'items' | 'messages' | 'settings') => void;
  onLoginClick: () => void;
  onUploadClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  customButtons?: React.ReactNode;
  onFilterClick?: () => void;
  onShareClick?: () => void;
  onReloadClick?: () => void;
}

// Helper function to get badge icon component
const getBadgeIcon = (iconName: string, size = 16) => {
  const iconProps = { size };
  switch (iconName) {
    case 'CheckCircle':
      return <CheckCircle {...iconProps} />;
    case 'Store':
      return <Store {...iconProps} />;
    case 'Crown':
      return <Crown {...iconProps} />;
    case 'Award':
      return <Award {...iconProps} />;
    case 'Shield':
      return <Shield {...iconProps} />;
    case 'Sparkles':
      return <Sparkles {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
};

export const Header = ({ onNavigate, onLoginClick, onUploadClick, searchQuery = '', onSearchChange, onSearch, showSearch = true, customButtons, onFilterClick, onShareClick, onReloadClick }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { unreadCount } = useUnreadMessages(30000);
  const { personalCredits } = useCreditsStats();
  const { status: userStatus } = useUserStatus();
  const { checkCredit } = useCreditCheck();
  const { settings } = useSystemSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [allItemsCount, setAllItemsCount] = useState(0);
  const [myItemsCount, setMyItemsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('mobileSearchExpanded');
    return saved === 'true';
  });
  const [creditInfo, setCreditInfo] = useState<{
    canCreate: boolean;
    source?: string;
    message: string;
    remainingDailyListings?: number;
    personalCredits?: number;
    communityPotBalance?: number;
  } | null>(null);

  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Save mobile search expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('mobileSearchExpanded', String(mobileSearchExpanded));

    // Auto-focus when opening mobile search
    if (mobileSearchExpanded && isMobile) {
      setTimeout(() => {
        const input = mobileSearchRef.current?.querySelector('input');
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }, [mobileSearchExpanded, isMobile]);

  useEffect(() => {
    if (user) {
      const loadProfileAndCounts = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (data) {
          setProfile(data);
          setIsAdmin(data.is_admin === true);
        }

        const [allCountResult, myCountResult, favCountResult] = await Promise.all([
          supabase
            .from('items')
            .select('id', { count: 'exact', head: false })
            .eq('status', 'published'),
          supabase
            .from('items')
            .select('id', { count: 'exact', head: false })
            .eq('user_id', user.id),
          supabase
            .from('favorites')
            .select('id', { count: 'exact', head: false })
            .eq('user_id', user.id)
        ]);

        setAllItemsCount(allCountResult.count || 0);
        setMyItemsCount(myCountResult.count || 0);
        setFavoritesCount(favCountResult.count || 0);
      };
      loadProfileAndCounts();
    } else {
      setProfile(null);
      setAllItemsCount(0);
      setMyItemsCount(0);
      setFavoritesCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkCredit().then(setCreditInfo);
    }
  }, [user, checkCredit]);

  useEffect(() => {
    setAnchorEl(null);
  }, [location.pathname]);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
  };

  const handleSettings = () => {
    handleMenuClose();
    navigate('/settings');
  };

  return (
    <>
      {/* Safe Area Top Background */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'env(safe-area-inset-top)',
        bgcolor: '#f7f7f7',
        zIndex: 1300
      }} />
      <AppBar position="sticky" elevation={0} sx={{
        top: 'env(safe-area-inset-top)',
        bgcolor: '#f7f7f7',
        color: 'text.primary',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
      }}>
      <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minHeight: { xs: 64, sm: 72 }, px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 1.5 } }}>
        <Box
          component="img"
          src="/logo.png"
          alt="HABDAWAS"
          sx={{
            height: isMobile ? 28 : 32,
            cursor: 'pointer',
            objectFit: 'contain',
            borderRadius: 1,
            flexShrink: 0,
          }}
          onClick={() => onNavigate('items')}
        />

        {showSearch && onSearchChange && !isMobile && (
          <Box sx={{ flex: 1, maxWidth: 720, mx: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchAutocomplete
              fullWidth
              value={searchQuery}
              onChange={onSearchChange}
              onSearch={onSearch || onSearchChange}
              placeholder="Suche nach Produkten, Kategorien, Marken..."
              onFilterClick={onFilterClick}
            />
            {onFilterClick && (
              <IconButton
                onClick={onFilterClick}
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'rgba(0, 0, 0, 0.12)',
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                }}
              >
                <SlidersHorizontal size={20} />
              </IconButton>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, ml: 'auto' }}>
          {/* Mobile Search Toggle */}
          {showSearch && onSearchChange && isMobile && (
            <IconButton
              onClick={() => setMobileSearchExpanded(!mobileSearchExpanded)}
              sx={{
                color: 'text.primary',
                bgcolor: mobileSearchExpanded ? 'rgba(25, 118, 210, 0.1)' : 'transparent'
              }}
            >
              <Search size={22} />
            </IconButton>
          )}
          {customButtons ? (
            customButtons
          ) : (
            <>
              {user ? (
                <>
                  <IconButton
                    onClick={() => onNavigate('messages')}
                    sx={{
                      color: 'text.primary',
                      width: 40,
                      height: 40,
                      mr: 0.5,
                    }}
                  >
                    <Badge
                      badgeContent={unreadCount}
                      color="error"
                      max={99}
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.65rem',
                          height: 18,
                          minWidth: 18,
                        }
                      }}
                    >
                      <MessageCircle size={20} />
                    </Badge>
                  </IconButton>
                  {location.pathname !== '/create' && (
                    <>
                      {!isMobile && (
                        <Button
                          onClick={() => navigate('/create')}
                          startIcon={<Camera size={18} />}
                          variant="contained"
                          sx={{
                            mr: 1.5,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                          }}
                        >
                          Inserat anlegen
                        </Button>
                      )}
                      {isMobile && (
                        <IconButton
                          onClick={() => navigate('/create')}
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            mr: 0.5,
                            width: 40,
                            height: 40,
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                          }}
                        >
                          <Camera size={20} />
                        </IconButton>
                      )}
                    </>
                  )}
                  <IconButton
                    onClick={handleAvatarClick}
                    sx={{
                      ml: 0.5,
                      p: 0,
                      position: 'relative',
                    }}
                  >
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                      badgeContent={
                        userStatus?.topBadge ? (
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              bgcolor: userStatus.topBadge.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid white',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                          >
                            {getBadgeIcon(userStatus.topBadge.icon, 10)}
                          </Box>
                        ) : null
                      }
                    >
                      <Avatar
                        src={profile?.avatar_url || undefined}
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'primary.main',
                          fontSize: '1rem',
                          fontWeight: 600,
                          border: '2px solid',
                          borderColor: 'background.paper',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        {!profile?.avatar_url && user.email?.[0].toUpperCase()}
                      </Avatar>
                    </Badge>
                  </IconButton>
                </>
              ) : (
                <Button
                  onClick={onLoginClick}
                  variant="contained"
                  sx={{
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    px: { xs: 2.5, sm: 3.5 },
                    py: 1,
                    bgcolor: 'primary.main',
                    color: 'white',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Anmelden
                </Button>
              )}
            </>
          )}
        </Box>
      </Toolbar>

      {/* Mobile Search Bar - Collapsible */}
      {showSearch && onSearchChange && isMobile && mobileSearchExpanded && (
        <Box
          ref={mobileSearchRef}
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: '#fafafa',
            borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchAutocomplete
              fullWidth
              value={searchQuery}
              onChange={onSearchChange}
              onSearch={onSearch || onSearchChange}
              placeholder="Suche nach Produkten, Kategorien, Marken..."
            />
            {onFilterClick && (
              <IconButton
                onClick={onFilterClick}
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'rgba(0, 0, 0, 0.12)',
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                }}
              >
                <SlidersHorizontal size={20} />
              </IconButton>
            )}
          </Box>
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        keepMounted={false}
        disableScrollLock={false}
        BackdropProps={{
          onClick: handleMenuClose,
          sx: { cursor: 'default' }
        }}
        MenuListProps={{
          sx: { p: 0 }
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 280,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Card Header with Status */}
        <Box
          onClick={() => { handleMenuClose(); navigate('/settings?section=profile'); }}
          sx={{
            px: 2.5,
            py: 2.5,
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(25, 118, 210, 0.04)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              badgeContent={
                userStatus?.topBadge ? (
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      bgcolor: userStatus.topBadge.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      color: 'white',
                    }}
                  >
                    {getBadgeIcon(userStatus.topBadge.icon, 12)}
                  </Box>
                ) : null
              }
            >
              <Avatar
                src={profile?.avatar_url || undefined}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.main',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  border: '2px solid',
                  borderColor: 'background.paper',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                {!profile?.avatar_url && user?.email?.[0].toUpperCase()}
              </Avatar>
            </Badge>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {profile?.full_name || user?.email}
              </Typography>
              {profile?.full_name && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.email}
                </Typography>
              )}
              {userStatus && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    bgcolor: userStatus.statusColor,
                    color: 'white',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    mt: 0.5,
                  }}
                >
                  {userStatus.topBadge && getBadgeIcon(userStatus.topBadge.icon, 10)}
                  <span>{userStatus.level}</span>
                </Box>
              )}
            </Box>
            <User size={18} style={{ color: '#666', opacity: 0.5 }} />
          </Box>

          {/* Badge Showcase - Icon only, labels on hover */}
          {userStatus && userStatus.badges.some(b => b.achieved) && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', pt: 1, borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}>
              {userStatus.badges
                .filter(b => b.achieved)
                .sort((a, b) => b.priority - a.priority)
                .map((badge) => (
                  <Tooltip
                    key={badge.id}
                    title={
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" fontWeight={600} display="block">
                          {badge.name}
                        </Typography>
                        <Typography variant="caption" fontSize="0.65rem" display="block" sx={{ opacity: 0.9 }}>
                          {badge.description}
                        </Typography>
                      </Box>
                    }
                    arrow
                    enterDelay={200}
                    enterTouchDelay={0}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${badge.color}15`,
                        border: `1px solid ${badge.color}40`,
                        color: badge.color,
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        cursor: 'help',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: `${badge.color}25`,
                          transform: 'scale(1.1)',
                          boxShadow: `0 2px 8px ${badge.color}30`,
                        },
                      }}
                    >
                      {getBadgeIcon(badge.icon, 12)}
                    </Box>
                  </Tooltip>
                ))}
            </Box>
          )}
        </Box>

        {/* Prominent Mein Guthaben */}
        <MenuItem
          onClick={() => { handleMenuClose(); navigate('/settings?section=tokens'); }}
          sx={{
            px: 2.5,
            py: 1.5,
            bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
            },
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            fontWeight: 600,
          }}
        >
          <ListItemIcon>
            <Coins size={20} style={{ color: '#667eea' }} />
          </ListItemIcon>
          <ListItemText
            primary="Mein Guthaben"
            secondary={`${personalCredits} Inserate verfügbar`}
            primaryTypographyProps={{ fontWeight: 600, color: '#667eea' }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
          <Box
            sx={{
              bgcolor: '#667eea',
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {personalCredits}
          </Box>
        </MenuItem>

        <Box sx={{ py: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ px: 2.5, py: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
            Meine Inserate
          </Typography>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/'); }}>
            <ListItemIcon>
              <List size={20} />
            </ListItemIcon>
            <ListItemText>Alle Inserate</ListItemText>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({allItemsCount})</Typography>
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/?filter=my'); }}>
            <ListItemIcon>
              <FileText size={20} />
            </ListItemIcon>
            <ListItemText>Meine Inserate</ListItemText>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({myItemsCount})</Typography>
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/?filter=favorites'); }}>
            <ListItemIcon>
              <Heart size={20} />
            </ListItemIcon>
            <ListItemText>Favoriten</ListItemText>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({favoritesCount})</Typography>
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/categories'); }}>
            <ListItemIcon>
              <FolderTree size={20} />
            </ListItemIcon>
            <ListItemText>Kategorien</ListItemText>
          </MenuItem>
        </Box>

        <Divider sx={{ my: 0.5 }} />

        <Box sx={{ py: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ px: 2.5, py: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
            Konto & Einstellungen
          </Typography>
          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <Settings size={20} />
            </ListItemIcon>
            <ListItemText>Einstellungen</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => { handleMenuClose(); navigate('/tokens?tab=community'); }}
          >
            <ListItemIcon>
              <Heart size={20} style={{ color: '#e91e63' }} />
            </ListItemIcon>
            <ListItemText>Community-Topf</ListItemText>
          </MenuItem>
        </Box>

        <Divider sx={{ my: 0.5 }} />
        {isAdmin && (
          <>
            <MenuItem
              onClick={() => { handleMenuClose(); navigate('/admin'); }}
              sx={{
                bgcolor: 'rgba(211, 47, 47, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(211, 47, 47, 0.15)',
                },
                borderLeft: '4px solid',
                borderColor: 'error.main',
                my: 0.5,
              }}
            >
              <ListItemIcon>
                <Shield size={20} style={{ color: '#d32f2f' }} />
              </ListItemIcon>
              <ListItemText
                primary="Admin-Bereich"
                primaryTypographyProps={{
                  fontWeight: 700,
                  color: 'error.main',
                }}
              />
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
          </>
        )}
        <MenuItem onClick={() => { handleMenuClose(); navigate('/about'); }}>
          <ListItemIcon>
            <Info size={20} />
          </ListItemIcon>
          <ListItemText>Über HABDAWAS</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={handleLogout}
          sx={{ mb: 1.5 }}
        >
          <ListItemIcon>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText>Abmelden</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
    </>
  );
};
