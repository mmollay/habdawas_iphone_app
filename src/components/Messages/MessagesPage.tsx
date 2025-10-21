import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  TextField,
  IconButton,
  Divider,
  CircularProgress,
  Badge,
  useTheme,
  useMediaQuery,
  Fade,
  Chip,
  InputAdornment,
  Menu,
  MenuItem,
} from '@mui/material';
import { Send, ArrowLeft, Image as ImageIcon, Search, MoreVertical, Smile } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { supabase, Conversation, Message, Item, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getRelativeTimeString } from '../../utils/dateUtils';

interface ConversationWithDetails extends Conversation {
  item?: Item;
  other_user?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export const MessagesPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  const swipeHandlers = useSwipeable({
    onSwipedRight: () => {
      if (isMobile && selectedConversation) {
        setShowConversationList(true);
        setSelectedConversation(null);
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 50,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [buyerConvs, sellerConvs] = await Promise.all([
        supabase
          .from('conversations')
          .select('*')
          .eq('buyer_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('conversations')
          .select('*')
          .eq('seller_id', user.id)
          .order('updated_at', { ascending: false }),
      ]);

      if (buyerConvs.error) throw buyerConvs.error;
      if (sellerConvs.error) throw sellerConvs.error;

      const convData = [
        ...(buyerConvs.data || []),
        ...(sellerConvs.data || []),
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;

          const [itemResult, profileResult, messagesResult] = await Promise.all([
            supabase.from('items').select('*').eq('id', conv.item_id).maybeSingle(),
            supabase.from('profiles').select('*').eq('id', otherUserId).maybeSingle(),
            supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
          ]);

          const unreadResult = await supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            item: itemResult.data || undefined,
            other_user: profileResult.data || undefined,
            last_message: messagesResult.data?.[0],
            unread_count: unreadResult.count || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user?.id || '');

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedConversation.id);
      await loadConversations();
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      if (isMobile) {
        setShowConversationList(false);
      }
    }
  }, [selectedConversation, isMobile]);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      const firstUnreadConversation = conversations.find(conv => (conv.unread_count || 0) > 0);
      if (firstUnreadConversation) {
        setSelectedConversation(firstUnreadConversation);
      }
    }
  }, [conversations]);

  if (loading) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          py: isMobile ? 0 : 4,
          height: isMobile ? '100%' : 'auto',
          flex: isMobile ? 1 : 'unset',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress size={48} thickness={4} />
      </Container>
    );
  }

  return (
      <Container
        maxWidth="xl"
        sx={{
          py: isMobile ? 0 : 3,
          px: isMobile ? 0 : 2,
          height: isMobile ? '100%' : 'calc(100vh - 88px)',
          flex: isMobile ? 1 : 'unset'
        }}
      >
      <Paper
        elevation={isMobile ? 0 : 2}
        sx={{
          height: '100%',
          display: 'flex',
          overflow: 'hidden',
          borderRadius: isMobile ? 0 : 3,
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            width: isMobile ? '100%' : 380,
            borderRight: 1,
            borderColor: 'divider',
            display: isMobile && !showConversationList ? 'none' : 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
          }}
        >
          <Box
            sx={{
              p: isMobile ? 2 : 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isMobile ? 1.5 : 1 }}>
              <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600}>
                Nachrichten
              </Typography>
              {!isMobile && (
                <IconButton size="small" sx={{ color: 'primary.contrastText' }}>
                  <Search size={20} />
                </IconButton>
              )}
            </Box>
            {conversations.length > 0 && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {conversations.length} {conversations.length === 1 ? 'Konversation' : 'Konversationen'}
              </Typography>
            )}
          </Box>

          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {conversations.length === 0 ? (
              <Box sx={{ p: isMobile ? 3 : 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Keine Konversationen
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Starte eine Unterhaltung über ein Angebot
                </Typography>
              </Box>
            ) : (
              conversations.map((conv, index) => (
                <Box key={conv.id}>
                  <ListItemButton
                    selected={selectedConversation?.id === conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      if (isMobile) {
                        setShowConversationList(false);
                      }
                    }}
                    sx={{
                      py: isMobile ? 2 : 2.5,
                      px: isMobile ? 2 : 2.5,
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        borderLeft: 4,
                        borderColor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.lighter',
                        }
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          conv.unread_count! > 0 ? (
                            <Box
                              sx={{
                                width: isMobile ? 18 : 20,
                                height: isMobile ? 18 : 20,
                                borderRadius: '50%',
                                bgcolor: 'error.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: isMobile ? '0.7rem' : '0.75rem',
                                fontWeight: 600,
                                border: '2px solid white',
                              }}
                            >
                              {conv.unread_count! > 9 ? '9+' : conv.unread_count}
                            </Box>
                          ) : null
                        }
                      >
                        <Avatar
                          src={conv.item?.image_url}
                          sx={{
                            width: isMobile ? 52 : 56,
                            height: isMobile ? 52 : 56,
                            border: '2px solid',
                            borderColor: 'background.paper',
                            boxShadow: 1,
                          }}
                        >
                          {conv.other_user?.full_name?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      sx={{ ml: isMobile ? 1.5 : 1.5 }}
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={conv.unread_count! > 0 ? 600 : 500}
                            noWrap
                            sx={{ flex: 1, mr: 1, fontSize: isMobile ? '0.95rem' : '1rem' }}
                          >
                            {conv.other_user?.full_name || 'Unbekannt'}
                          </Typography>
                          {conv.last_message && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ flexShrink: 0, fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                            >
                              {getRelativeTimeString(conv.last_message.created_at)}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <ImageIcon size={isMobile ? 12 : 14} style={{ opacity: 0.6 }} />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                              component="span"
                              sx={{ fontWeight: 500, fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                            >
                              {conv.item?.title || 'Item gelöscht'}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            color={conv.unread_count! > 0 ? 'text.primary' : 'text.secondary'}
                            fontWeight={conv.unread_count! > 0 ? 500 : 400}
                            noWrap
                            component="span"
                            sx={{ fontSize: isMobile ? '0.85rem' : '0.875rem' }}
                          >
                            {conv.last_message?.content || 'Noch keine Nachrichten'}
                          </Typography>
                        </>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItemButton>
                  {index < conversations.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))
            )}
          </List>
        </Box>

        <Box
          {...swipeHandlers}
          sx={{
            flex: 1,
            display: isMobile && showConversationList ? 'none' : 'flex',
            flexDirection: 'column',
            touchAction: 'pan-y',
            bgcolor: 'background.default',
          }}
        >
          {selectedConversation ? (
            <>
              <Box
                sx={{
                  p: isMobile ? 1.5 : 2.5,
                  bgcolor: 'background.paper',
                  borderBottom: 1,
                  borderColor: 'divider',
                  boxShadow: isMobile ? '0 2px 4px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.5 : 2 }}>
                  {isMobile && (
                    <IconButton
                      onClick={() => {
                        setShowConversationList(true);
                        setSelectedConversation(null);
                      }}
                      size="small"
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                        }
                      }}
                    >
                      <ArrowLeft size={22} />
                    </IconButton>
                  )}

                  <Avatar
                    src={selectedConversation.item?.image_url}
                    sx={{
                      width: isMobile ? 40 : 48,
                      height: isMobile ? 40 : 48,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      boxShadow: 1,
                    }}
                  >
                    {selectedConversation.other_user?.full_name?.[0]?.toUpperCase() || '?'}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant={isMobile ? 'body1' : 'subtitle1'} fontWeight={600} noWrap>
                      {selectedConversation.other_user?.full_name || 'Unbekannt'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ImageIcon size={isMobile ? 11 : 12} style={{ opacity: 0.6 }} />
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
                        {selectedConversation.item?.title || 'Item gelöscht'}
                      </Typography>
                    </Box>
                  </Box>

                  {!isMobile && (
                    <IconButton
                      size="small"
                      onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                    >
                      <MoreVertical size={20} />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: isMobile ? 2 : 3,
                  bgcolor: isMobile ? 'grey.100' : 'grey.50',
                  backgroundImage: isMobile
                    ? 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.03) 100%)'
                    : 'linear-gradient(180deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.02) 100%)',
                }}
              >
                {messages.length === 0 ? (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      px: 3,
                    }}
                  >
                    <Box>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        Noch keine Nachrichten
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sende die erste Nachricht
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <>
                    {messages.map((message, index) => {
                      const isOwn = message.sender_id === user?.id;
                      const showDate = index === 0 ||
                        new Date(messages[index - 1].created_at).toDateString() !== new Date(message.created_at).toDateString();

                      return (
                        <Box key={message.id}>
                          {showDate && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: isMobile ? 2 : 3 }}>
                              <Chip
                                label={new Date(message.created_at).toLocaleDateString('de-DE', {
                                  weekday: isMobile ? 'short' : 'long',
                                  year: 'numeric',
                                  month: isMobile ? 'short' : 'long',
                                  day: 'numeric'
                                })}
                                size="small"
                                sx={{
                                  bgcolor: 'background.paper',
                                  boxShadow: 1,
                                  fontWeight: 500,
                                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                                  height: isMobile ? 24 : 28,
                                }}
                              />
                            </Box>
                          )}

                          <Fade in={true} timeout={300}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                mb: isMobile ? 1 : 1.5,
                              }}
                            >
                              <Box
                                sx={{
                                  maxWidth: isMobile ? '80%' : '75%',
                                  bgcolor: isOwn ? 'primary.main' : 'background.paper',
                                  color: isOwn ? 'primary.contrastText' : 'text.primary',
                                  px: isMobile ? 1.5 : 2,
                                  py: isMobile ? 1.25 : 1.5,
                                  borderRadius: isOwn
                                    ? isMobile ? '18px 18px 4px 18px' : '20px 20px 4px 20px'
                                    : isMobile ? '18px 18px 18px 4px' : '20px 20px 20px 4px',
                                  boxShadow: isOwn ? 2 : 1,
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    transform: isMobile ? 'none' : 'translateY(-1px)',
                                    boxShadow: isOwn ? 3 : 2,
                                  }
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    wordWrap: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.5,
                                    fontSize: isMobile ? '0.9rem' : '1rem',
                                  }}
                                >
                                  {message.content}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    opacity: isOwn ? 0.85 : 0.7,
                                    display: 'block',
                                    mt: 0.5,
                                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                                  }}
                                >
                                  {new Date(message.created_at).toLocaleTimeString('de-DE', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              </Box>
                            </Box>
                          </Fade>
                        </Box>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              <Box
                sx={{
                  p: isMobile ? 1.5 : 2.5,
                  bgcolor: 'background.paper',
                  borderTop: 1,
                  borderColor: 'divider',
                  boxShadow: isMobile
                    ? '0 -4px 12px rgba(0,0,0,0.06)'
                    : '0 -1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    gap: isMobile ? 1 : 1.5,
                    alignItems: 'flex-end',
                    bgcolor: isMobile ? 'grey.100' : 'transparent',
                    borderRadius: isMobile ? 7 : 0,
                    p: isMobile ? 0.75 : 0,
                  }}
                >
                  <TextField
                    fullWidth
                    inputRef={inputRef}
                    placeholder="Nachricht..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    multiline
                    maxRows={isMobile ? 3 : 4}
                    disabled={sending}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: isMobile ? 'transparent' : 'grey.50',
                        borderRadius: isMobile ? 0 : 3,
                        fontSize: isMobile ? '0.95rem' : '0.95rem',
                        py: isMobile ? 0.5 : 0.75,
                        px: isMobile ? 1.5 : 1.5,
                        transition: 'all 0.2s ease',
                        '& fieldset': {
                          borderColor: isMobile ? 'transparent' : 'divider',
                          borderWidth: isMobile ? 0 : 1,
                        },
                        '&:hover': {
                          bgcolor: isMobile ? 'transparent' : 'grey.100',
                          '& fieldset': {
                            borderColor: isMobile ? 'transparent' : 'primary.light',
                          },
                        },
                        '&.Mui-focused': {
                          bgcolor: isMobile ? 'transparent' : 'background.paper',
                          '& fieldset': {
                            borderColor: isMobile ? 'transparent' : 'primary.main',
                            borderWidth: isMobile ? 0 : 2,
                          },
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: 0,
                      }
                    }}
                  />

                  <IconButton
                    color="primary"
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      width: isMobile ? 46 : 48,
                      height: isMobile ? 46 : 48,
                      flexShrink: 0,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: 2,
                      mr: isMobile ? 0.5 : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 0,
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        transform: 'scale(1.05)',
                        boxShadow: 3,
                      },
                      '&:active': {
                        transform: 'scale(0.95)',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'grey.300',
                        color: 'grey.500',
                        boxShadow: 0,
                      },
                    }}
                  >
                    {sending ? (
                      <CircularProgress size={isMobile ? 20 : 22} color="inherit" />
                    ) : (
                      <Send size={isMobile ? 20 : 22} style={{ transform: 'translateX(1px)' }} />
                    )}
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                px: 3,
              }}
            >
              <Box>
                <Typography variant={isMobile ? 'h6' : 'h5'} color="text.secondary" fontWeight={500} gutterBottom>
                  Wähle eine Konversation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Starte eine Unterhaltung aus der Liste {isMobile ? 'oben' : 'links'}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { setMoreMenuAnchor(null); }}>
          <ListItemText>Alle als gelesen markieren</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMoreMenuAnchor(null); }}>
          <ListItemText>Konversation archivieren</ListItemText>
        </MenuItem>
      </Menu>
    </Container>
  );
};
