import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
} from '@mui/material';
import { Menu, X } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';
import { AdminSidebar } from './AdminSidebar';
import UserManagementTab from './UserManagementTab';
import RoleManagementTab from './RoleManagementTab';
import TaskManagementTab from './TaskManagementTab';
import { CreditSystemSettings } from './CreditSystemSettings';
import { Header } from '../Layout/Header';
import { Footer } from '../Layout/Footer';

type AdminSection = 'users' | 'roles' | 'tasks' | 'credits';

const AdminPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin, loading } = useAdmin();
  const [currentSection, setCurrentSection] = useState<AdminSection>('users');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleSectionChange = (section: AdminSection) => {
    setCurrentSection(section);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'users':
        return <UserManagementTab />;
      case 'roles':
        return <RoleManagementTab />;
      case 'tasks':
        return <TaskManagementTab />;
      case 'credits':
        return <CreditSystemSettings />;
      default:
        return <UserManagementTab />;
    }
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'users':
        return 'Benutzerverwaltung';
      case 'roles':
        return 'Rollen & Rechte';
      case 'tasks':
        return 'Aufgaben';
      case 'credits':
        return 'Credit-System';
      default:
        return 'Admin-Bereich';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        onNavigate={(page) => {
          if (page === 'items') navigate('/');
          else if (page === 'messages') navigate('/messages');
          else if (page === 'settings') navigate('/settings');
        }}
        onLoginClick={() => {}}
        showSearch={false}
      />

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <AdminSidebar
            currentSection={currentSection}
            onSectionChange={handleSectionChange}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: 260,
                boxSizing: 'border-box',
              },
            }}
          >
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider'
            }}>
              <Typography variant="h6" fontWeight={600}>
                Admin-Bereich
              </Typography>
              <IconButton onClick={() => setMobileDrawerOpen(false)} size="small">
                <X size={20} />
              </IconButton>
            </Box>
            <AdminSidebar
              currentSection={currentSection}
              onSectionChange={handleSectionChange}
              collapsed={false}
              onToggleCollapse={() => {}}
              isMobile={true}
            />
          </Drawer>
        )}

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Mobile Menu Button */}
            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton
                  onClick={() => setMobileDrawerOpen(true)}
                  sx={{
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                  <Menu size={20} />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {getSectionTitle()}
                </Typography>
              </Box>
            )}

            {/* Desktop Title */}
            {!isMobile && (
              <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                {getSectionTitle()}
              </Typography>
            )}

            {/* Content Area */}
            {renderContent()}
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default AdminPage;
