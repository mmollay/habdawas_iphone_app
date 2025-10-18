import { Box, Paper, List, ListItemButton, ListItemIcon, ListItemText, IconButton, Tooltip } from '@mui/material';
import { User as UserIcon, MapPin, Bell, Sparkles, Eye, ChevronLeft, ChevronRight, Package, Coins, Shield, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';

type SettingsSection = 'overview' | 'profile' | 'security' | 'addresses' | 'shipping' | 'display' | 'ai' | 'notifications' | 'tokens' | 'admin';

interface SettingsSidebarProps {
  currentSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
}

export const SettingsSidebar = ({ currentSection, onSectionChange, collapsed, onToggleCollapse, isMobile = false }: SettingsSidebarProps) => {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const settingsSections = [
    { id: 'profile' as SettingsSection, label: 'Persönliche Daten', icon: <UserIcon size={20} /> },
    { id: 'security' as SettingsSection, label: 'Sicherheit', icon: <Lock size={20} /> },
    { id: 'tokens' as SettingsSection, label: 'Mein Guthaben', icon: <Coins size={20} /> },
    { id: 'addresses' as SettingsSection, label: 'Adressen', icon: <MapPin size={20} /> },
    { id: 'shipping' as SettingsSection, label: 'Versand & Abholung', icon: <Package size={20} /> },
    { id: 'display' as SettingsSection, label: 'Anzeige', icon: <Eye size={20} /> },
    { id: 'ai' as SettingsSection, label: 'KI-Assistent', icon: <Sparkles size={20} /> },
    { id: 'notifications' as SettingsSection, label: 'Benachrichtigungen', icon: <Bell size={20} /> },
  ];

  // Admin-Bereich nur für Admins sichtbar
  if (isAdmin) {
    settingsSections.push({
      id: 'admin' as SettingsSection,
      label: 'Administration',
      icon: <Shield size={20} />
    });
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: isMobile ? '100%' : (collapsed ? 72 : 260),
        transition: 'width 0.3s ease',
        height: isMobile ? '100%' : '100vh',
        borderRight: isMobile ? 0 : 1,
        borderColor: 'divider',
        borderRadius: 0,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'relative' : 'sticky',
        top: 0,
        left: 0,
      }}
    >
      {!isMobile && (
        <Box sx={{
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected' }
            }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </IconButton>
        </Box>
      )}

      <List sx={{ pt: 2, pb: 2 }}>
        {settingsSections.map((section) => {
          const button = (
            <ListItemButton
              key={section.id}
              onClick={() => {
                if (section.id === 'admin') {
                  navigate('/admin');
                } else {
                  onSectionChange(section.id);
                }
              }}
              selected={currentSection === section.id}
              sx={{
                mb: 0.5,
                mx: (collapsed && !isMobile) ? 1 : 1.5,
                borderRadius: 2,
                minHeight: 48,
                justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start',
                px: (collapsed && !isMobile) ? 0 : 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: (collapsed && !isMobile) ? 'action.hover' : 'action.selected',
                }
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: (collapsed && !isMobile) ? 'auto' : 40,
                  justifyContent: 'center',
                  color: currentSection === section.id ? 'inherit' : 'text.secondary'
                }}
              >
                {section.icon}
              </ListItemIcon>
              {(!collapsed || isMobile) && (
                <ListItemText
                  primary={section.label}
                  primaryTypographyProps={{
                    fontWeight: currentSection === section.id ? 600 : 400,
                    fontSize: '0.95rem',
                  }}
                />
              )}
            </ListItemButton>
          );

          return isMobile ? (
            button
          ) : (
            <Tooltip
              key={section.id}
              title={collapsed ? section.label : ''}
              placement="right"
              arrow
            >
              {button}
            </Tooltip>
          );
        })}
      </List>
    </Paper>
  );
};
