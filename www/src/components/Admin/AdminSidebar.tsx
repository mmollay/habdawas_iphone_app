import { Box, Paper, List, ListItemButton, ListItemIcon, ListItemText, IconButton, Tooltip, Divider } from '@mui/material';
import { Users, Shield, ListTodo, Coins, ChevronLeft, ChevronRight } from 'lucide-react';

type AdminSection = 'users' | 'roles' | 'tasks' | 'credits';

interface AdminSidebarProps {
  currentSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
}

export const AdminSidebar = ({ currentSection, onSectionChange, collapsed, onToggleCollapse, isMobile = false }: AdminSidebarProps) => {
  const adminSections = [
    { id: 'users' as AdminSection, label: 'Benutzerverwaltung', icon: <Users size={20} /> },
    { id: 'roles' as AdminSection, label: 'Rollen & Rechte', icon: <Shield size={20} /> },
    { id: 'credits' as AdminSection, label: 'Credit-System', icon: <Coins size={20} /> },
    { id: 'tasks' as AdminSection, label: 'Aufgaben', icon: <ListTodo size={20} /> },
  ];

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
        {adminSections.map((section, index) => {
          const button = (
            <ListItemButton
              key={section.id}
              onClick={() => onSectionChange(section.id)}
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

          const buttonWithTooltip = isMobile ? (
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

          // Add divider before "Aufgaben" section
          if (section.id === 'tasks') {
            return (
              <Box key={section.id}>
                <Divider sx={{ my: 2, mx: 2 }} />
                {buttonWithTooltip}
              </Box>
            );
          }

          return buttonWithTooltip;
        })}
      </List>
    </Paper>
  );
};
