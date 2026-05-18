import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Alert,
  Badge,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Pagination,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Inbox as InboxIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  FiberNew as FiberNewIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';

// 1. Establish the custom Dark Mode Theme with rich color tokens (Complies with Design Aesthetics)
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Vibrant Indigo
    },
    secondary: {
      main: '#06b6d4', // Cyan Accent
    },
    background: {
      default: '#0a0f1d', // Ultra dark background
      paper: '#111827',   // Dark card background
    },
    text: {
      primary: '#f9fafb',
      secondary: '#9ca3af',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", sans-serif',
    h3: {
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            boxShadow: '0 12px 20px -10px rgba(99, 102, 241, 0.3)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

interface Notification {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [priorityNotifications, setPriorityNotifications] = useState<Notification[]>([]);
  
  // States for All Notifications Page
  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  // States for Priority Inbox Page
  const [priorityN, setPriorityN] = useState<number>(10);
  const [priorityTypeFilter, setPriorityTypeFilter] = useState<string>('');
  
  // Loading & Error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local storage for viewed notifications
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  // Load viewed notification IDs on start
  useEffect(() => {
    const saved = localStorage.getItem('viewedNotificationIds');
    if (saved) {
      try {
        setViewedIds(new Set(JSON.parse(saved)));
      } catch (e) {
        // Silently capture parse errors
      }
    }
  }, []);

  // Sync viewed notifications to local storage
  const markAsViewed = (id: string) => {
    const newViewed = new Set(viewedIds);
    newViewed.add(id);
    setViewedIds(newViewed);
    localStorage.setItem('viewedNotificationIds', JSON.stringify(Array.from(newViewed)));
  };

  const markAllAsViewed = () => {
    const allIds = new Set(viewedIds);
    notifications.forEach((n) => allIds.add(n.ID));
    priorityNotifications.forEach((n) => allIds.add(n.ID));
    setViewedIds(allIds);
    localStorage.setItem('viewedNotificationIds', JSON.stringify(Array.from(allIds)));
  };

  // Fetch paginated/filtered notifications
  const fetchAllNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/notifications', {
        params: {
          limit,
          page,
          notification_type: typeFilter || undefined,
        },
      });
      if (response.data && response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch prioritized notifications using custom Heap algorithm
  const fetchPriorityNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/notifications/priority', {
        params: {
          n: priorityN,
        },
      });
      if (response.data && response.data.success) {
        let fetched = response.data.notifications as Notification[];
        // Client-side filter on type if specified
        if (priorityTypeFilter) {
          fetched = fetched.filter(
            (n) => n.Type.toLowerCase() === priorityTypeFilter.toLowerCase()
          );
        }
        setPriorityNotifications(fetched);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch priority notifications.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetches depending on active view tab
  useEffect(() => {
    if (activeTab === 0) {
      fetchAllNotifications();
    } else {
      fetchPriorityNotifications();
    }
  }, [activeTab, limit, page, typeFilter, priorityN, priorityTypeFilter]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
  };

  // Style chip mapping for Placement, Result, Event categories
  const getBadgeDetails = (type: string) => {
    const normType = type.toLowerCase();
    if (normType.includes('placement')) {
      return { label: 'Placement', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' };
    }
    if (normType.includes('result')) {
      return { label: 'Result', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
    if (normType.includes('event')) {
      return { label: 'Event', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };
    }
    return { label: 'General', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)' };
  };

  // Compute stats
  const unreadCount = notifications.filter(n => !viewedIds.has(n.ID)).length;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', py: 4, display: 'flex', flexDirection: 'column' }}>
        
        {/* Navigation / Header Area */}
        <Container maxWidth="lg" sx={{ mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              mb: 3,
            }}
          >
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Badge badgeContent={unreadCount} color="error" overlap="circular">
                    <AvatarIconWrapper>
                      <NotificationsIcon color="primary" sx={{ fontSize: 32 }} />
                    </AvatarIconWrapper>
                  </Badge>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      Campus Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stay updated with real-time Placements, Results, and Events
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<CheckCircleIcon />}
                  onClick={markAllAsViewed}
                  disabled={loading}
                >
                  Mark All as Read
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  onClick={activeTab === 0 ? fetchAllNotifications : fetchPriorityNotifications}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Tab Selection (All vs Priority) */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { py: 2, fontWeight: 700, fontSize: '1rem' },
            }}
          >
            <Tab
              icon={<NotificationsIcon />}
              iconPosition="start"
              label="All Notifications"
            />
            <Tab
              icon={<InboxIcon />}
              iconPosition="start"
              label="Priority Inbox"
            />
          </Tabs>
        </Container>

        {/* Content Container */}
        <Container maxWidth="lg" sx={{ flexGrow: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* 1. All Notifications View */}
          {activeTab === 0 && (
            <Box>
              {/* Toolbar Controls */}
              <Paper sx={{ p: 2.5, mb: 4, borderRadius: 3, background: '#111827' }} elevation={0}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel>Category Filter</InputLabel>
                      <Select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        label="Category Filter"
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        <MenuItem value="Placement">Placements</MenuItem>
                        <MenuItem value="Result">Results</MenuItem>
                        <MenuItem value="Event">Events</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel>Items Per Page</InputLabel>
                      <Select
                        value={limit}
                        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                        label="Items Per Page"
                      >
                        <MenuItem value={5}>5 Items</MenuItem>
                        <MenuItem value={10}>10 Items</MenuItem>
                        <MenuItem value={15}>15 Items</MenuItem>
                        <MenuItem value={20}>20 Items</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4} display="flex" justifyContent="flex-end">
                    <Typography variant="body2" color="text.secondary">
                      Showing loaded feed
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {loading ? (
                <LoadingSpinner />
              ) : notifications.length === 0 ? (
                <EmptyState message="No notifications matching the selected filters were found." />
              ) : (
                <Grid container spacing={2.5}>
                  {notifications.map((notif) => (
                    <Grid item xs={12} key={notif.ID}>
                      <NotificationCard
                        notif={notif}
                        viewed={viewedIds.has(notif.ID)}
                        onView={() => markAsViewed(notif.ID)}
                        badgeDetails={getBadgeDetails(notif.Type)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Simple Local Pagination Control */}
              {!loading && notifications.length > 0 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={5} // Keep pagination slider fluid
                    page={page}
                    onChange={(_e, val) => setPage(val)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </Box>
          )}

          {/* 2. Priority Inbox View */}
          {activeTab === 1 && (
            <Box>
              {/* Algorithm Details Header */}
              <Box mb={4}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px dashed rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                  elevation={0}
                >
                  <StarIcon color="primary" sx={{ fontSize: 28 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Min-Heap Sorted:</strong> This page renders the top <code>n</code> updates utilizing our highly efficient size-capped Min-Heap routing algorithm. Prioritization strictly follows weight layers: <code>Placement &gt; Result &gt; Event</code>, tie-broken by time.
                  </Typography>
                </Paper>
              </Box>

              {/* Priority Controls */}
              <Paper sx={{ p: 2.5, mb: 4, borderRadius: 3, background: '#111827' }} elevation={0}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Capacity (n)"
                      type="number"
                      variant="outlined"
                      size="small"
                      value={priorityN}
                      onChange={(e) => setPriorityN(Math.max(1, Number(e.target.value)))}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel>Type Filter</InputLabel>
                      <Select
                        value={priorityTypeFilter}
                        onChange={(e) => setPriorityTypeFilter(e.target.value)}
                        label="Type Filter"
                      >
                        <MenuItem value="">All Priority Types</MenuItem>
                        <MenuItem value="Placement">Placements</MenuItem>
                        <MenuItem value="Result">Results</MenuItem>
                        <MenuItem value="Event">Events</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4} display="flex" justifyContent="flex-end">
                    <Chip
                      icon={<StarIcon style={{ color: '#fbbf24' }} />}
                      label={`Top ${priorityN} Priority`}
                      variant="outlined"
                      color="secondary"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {loading ? (
                <LoadingSpinner />
              ) : priorityNotifications.length === 0 ? (
                <EmptyState message="No high priority items found in the current inbox buffer." />
              ) : (
                <Grid container spacing={2.5}>
                  {priorityNotifications.map((notif, index) => (
                    <Grid item xs={12} key={notif.ID}>
                      <NotificationCard
                        notif={notif}
                        index={index + 1}
                        viewed={viewedIds.has(notif.ID)}
                        onView={() => markAsViewed(notif.ID)}
                        badgeDetails={getBadgeDetails(notif.Type)}
                        isPriority
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Container>

        {/* Footer Area */}
        <Box component="footer" sx={{ py: 3, mt: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Container maxWidth="lg">
            <Typography variant="body2" color="text.secondary" align="center">
              Campus Notification Service Gateway Engine
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

// Sub-component Helper: Avatar Icon Wrapper
function AvatarIconWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: 4,
        background: 'rgba(99, 102, 241, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(99, 102, 241, 0.25)',
      }}
    >
      {children}
    </Box>
  );
}

// Sub-component Helper: Card Display for Notifications
interface CardProps {
  notif: Notification;
  index?: number;
  viewed: boolean;
  onView: () => void;
  badgeDetails: { label: string; color: string; bg: string };
  isPriority?: boolean;
}

function NotificationCard({ notif, index, viewed, onView, badgeDetails, isPriority }: CardProps) {
  return (
    <Card
      onClick={onView}
      sx={{
        opacity: viewed ? 0.6 : 1,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        '&::before': !viewed ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: 5,
          height: '100%',
          backgroundColor: badgeDetails.color,
        } : {},
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Grid container alignItems="center" spacing={2}>
          
          {/* Index Counter for Priority view */}
          {isPriority && index && (
            <Grid item>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 800, width: 32 }}>
                #{index}
              </Typography>
            </Grid>
          )}

          <Grid item xs>
            <Box display="flex" flexWrap="wrap" alignItems="center" gap={1.5} mb={1.5}>
              <Chip
                label={badgeDetails.label}
                size="small"
                sx={{
                  backgroundColor: badgeDetails.bg,
                  color: badgeDetails.color,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  border: `1px solid ${badgeDetails.color}33`,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {notif.Timestamp}
              </Typography>
              {!viewed && (
                <Chip
                  icon={<FiberNewIcon style={{ fontSize: 16 }} />}
                  label="New"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                />
              )}
            </Box>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: 0.5, textDecoration: viewed ? 'line-through' : 'none' }}>
              {notif.Message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {notif.ID}
            </Typography>
          </Grid>

          <Grid item sx={{ display: { xs: 'none', sm: 'block' } }}>
            {viewed ? (
              <Tooltip title="Viewed">
                <CheckCircleIcon color="secondary" />
              </Tooltip>
            ) : (
              <Button size="small" variant="text" color="primary" startIcon={<InfoOutlinedIcon />}>
                Mark Read
              </Button>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// Sub-component Helper: Loading spinner page
function LoadingSpinner() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress size={40} thickness={4} />
    </Box>
  );
}

// Sub-component Helper: EmptyState page
function EmptyState({ message }: { message: string }) {
  return (
    <Paper
      sx={{
        p: 6,
        textAlign: 'center',
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
      }}
      elevation={0}
    >
      <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Paper>
  );
}

export default App;
