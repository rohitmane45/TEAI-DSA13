import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ThemeProvider, createTheme, CssBaseline,
  Container, Box, Typography, Card, CardContent,
  Button, Tabs, Tab, TextField, Select, MenuItem,
  InputLabel, FormControl, CircularProgress, Alert,
  Badge, Chip, IconButton, Tooltip, Paper, Pagination,
  Fade, Grow, Stack, useMediaQuery,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  PriorityHigh as PriorityIcon,
  CheckCircleOutline as CheckIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  FiberNew as NewIcon,
  VisibilityOff as ViewedIcon,
  WorkOutline as PlacementIcon,
  SchoolOutlined as ResultIcon,
  EventNote as EventIcon,
  NotificationsNone as GeneralIcon,
  FilterList as FilterIcon,
  KeyboardArrowDown,
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#818cf8' },
    secondary: { main: '#34d399' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
    error: { main: '#f87171' },
    warning: { main: '#fbbf24' },
    success: { main: '#34d399' },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

const COLORS: Record<string, { accent: string; bg: string; icon: React.ReactNode }> = {
  placement: {
    accent: '#fbbf24', bg: 'rgba(251,191,36,0.12)',
    icon: <PlacementIcon sx={{ fontSize: 20, color: '#fbbf24' }} />,
  },
  result: {
    accent: '#34d399', bg: 'rgba(52,211,153,0.12)',
    icon: <ResultIcon sx={{ fontSize: 20, color: '#34d399' }} />,
  },
  event: {
    accent: '#f472b6', bg: 'rgba(244,114,182,0.12)',
    icon: <EventIcon sx={{ fontSize: 20, color: '#f472b6' }} />,
  },
  general: {
    accent: '#94a3b8', bg: 'rgba(148,163,184,0.1)',
    icon: <GeneralIcon sx={{ fontSize: 20, color: '#94a3b8' }} />,
  },
};

function getColor(type: string) {
  const t = type.toLowerCase();
  if (t.includes('placement')) return COLORS.placement;
  if (t.includes('result')) return COLORS.result;
  if (t.includes('event')) return COLORS.event;
  return COLORS.general;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts.replace(' ', 'T')).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface Notif {
  ID: string; Type: string; Message: string; Timestamp: string;
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [priority, setPriority] = useState<Notif[]>([]);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [topN, setTopN] = useState(10);
  const [prioFilter, setPrioFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [viewed, setViewed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('viewed') || '[]')); }
    catch { return new Set(); }
  });
  const mobile = useMediaQuery('(max-width:600px)');

  const saveViewed = useCallback((s: Set<string>) => {
    setViewed(s);
    localStorage.setItem('viewed', JSON.stringify([...s]));
  }, []);

  const markRead = (id: string) => { const s = new Set(viewed); s.add(id); saveViewed(s); };
  const markAll = () => {
    const s = new Set(viewed);
    [...notifs, ...priority].forEach(n => s.add(n.ID));
    saveViewed(s);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await axios.get('http://localhost:5000/notifications', {
        params: { limit, page, notification_type: typeFilter || undefined },
      });
      if (r.data?.success) setNotifs(r.data.notifications);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }, [limit, page, typeFilter]);

  const fetchPrio = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await axios.get('http://localhost:5000/notifications/priority', { params: { n: topN } });
      if (r.data?.success) {
        let d = r.data.notifications as Notif[];
        if (prioFilter) d = d.filter(n => n.Type.toLowerCase() === prioFilter.toLowerCase());
        setPriority(d);
      }
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }, [topN, prioFilter]);

  useEffect(() => { tab === 0 ? fetchAll() : fetchPrio(); }, [tab, fetchAll, fetchPrio]);

  const unread = notifs.filter(n => !viewed.has(n.ID)).length;
  const list = tab === 0 ? notifs : priority;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #1a1f3a 100%)' }}>

        {/* ─── HEADER ─── */}
        <Box sx={{
          background: 'linear-gradient(135deg, rgba(129,140,248,0.15) 0%, rgba(52,211,153,0.08) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)', py: { xs: 3, md: 4 },
        }}>
          <Container maxWidth="md">
            <Stack direction={mobile ? 'column' : 'row'} alignItems={mobile ? 'flex-start' : 'center'} justifyContent="space-between" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Badge badgeContent={unread} color="error" overlap="circular"
                  sx={{ '& .MuiBadge-badge': { fontWeight: 700, fontSize: 12 } }}>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: 3,
                    background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                  }}>
                    <NotificationsIcon sx={{ color: '#fff', fontSize: 28 }} />
                  </Box>
                </Badge>
                <Box>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.4rem', md: '1.75rem' } }}>
                    Campus Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                    Real-time Placements, Results &amp; Events
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" startIcon={<CheckIcon />}
                  onClick={markAll} sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }}>
                  Mark All Read
                </Button>
                <Button variant="contained" size="small" startIcon={<RefreshIcon />}
                  onClick={tab === 0 ? fetchAll : fetchPrio}
                  sx={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', boxShadow: '0 2px 12px rgba(99,102,241,0.4)' }}>
                  Refresh
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>

        <Container maxWidth="md" sx={{ py: 3 }}>

          {/* ─── TABS ─── */}
          <Paper sx={{ mb: 3, background: '#1e293b', border: '1px solid rgba(255,255,255,0.06)' }} elevation={0}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setErr(null); }}
              variant="fullWidth" indicatorColor="primary" textColor="primary"
              sx={{ '& .MuiTab-root': { py: 1.8, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.03em' } }}>
              <Tab icon={<NotificationsIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="All Notifications" />
              <Tab icon={<PriorityIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Priority Inbox" />
            </Tabs>
          </Paper>

          {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{err}</Alert>}

          {/* ─── FILTERS ─── */}
          <Fade in>
            <Paper sx={{ p: 2, mb: 3, background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.06)' }} elevation={0}>
              {tab === 0 ? (
                <Stack direction={mobile ? 'column' : 'row'} spacing={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel><FilterIcon sx={{ fontSize: 14, mr: 0.5 }} />Category</InputLabel>
                    <Select value={typeFilter} label="Category"
                      onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                      <MenuItem value="">All Categories</MenuItem>
                      <MenuItem value="Placement">🏢 Placements</MenuItem>
                      <MenuItem value="Result">📊 Results</MenuItem>
                      <MenuItem value="Event">🎉 Events</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Per Page</InputLabel>
                    <Select value={limit} label="Per Page"
                      onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
                      {[5, 10, 15, 20].map(v => <MenuItem key={v} value={v}>{v} items</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    Page {page} · {notifs.length} loaded
                  </Typography>
                </Stack>
              ) : (
                <Stack direction={mobile ? 'column' : 'row'} spacing={2} alignItems="center">
                  <TextField size="small" label="Top N" type="number" value={topN}
                    onChange={e => setTopN(Math.max(1, Number(e.target.value)))}
                    inputProps={{ min: 1 }} sx={{ width: 100 }} />
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Filter Type</InputLabel>
                    <Select value={prioFilter} label="Filter Type"
                      onChange={e => setPrioFilter(e.target.value)}>
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="Placement">🏢 Placements</MenuItem>
                      <MenuItem value="Result">📊 Results</MenuItem>
                      <MenuItem value="Event">🎉 Events</MenuItem>
                    </Select>
                  </FormControl>
                  <Chip icon={<StarIcon sx={{ color: '#fbbf24 !important' }} />}
                    label={`Top ${topN} Priority`} variant="outlined"
                    sx={{ ml: 'auto', borderColor: 'rgba(251,191,36,0.4)', color: '#fbbf24' }} />
                </Stack>
              )}
            </Paper>
          </Fade>

          {/* ─── PRIORITY BANNER ─── */}
          {tab === 1 && (
            <Paper sx={{
              p: 2, mb: 3, borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(52,211,153,0.05))',
              border: '1px dashed rgba(129,140,248,0.3)',
            }} elevation={0}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <StarIcon sx={{ color: '#818cf8' }} />
                <Typography variant="body2" color="text.secondary">
                  <strong>Min-Heap Algorithm:</strong> Notifications ranked by weight
                  (<code style={{ color: '#fbbf24' }}>Placement</code> &gt;{' '}
                  <code style={{ color: '#34d399' }}>Result</code> &gt;{' '}
                  <code style={{ color: '#f472b6' }}>Event</code>) then by recency.
                </Typography>
              </Stack>
            </Paper>
          )}

          {/* ─── NOTIFICATION LIST ─── */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress size={36} thickness={4} />
            </Box>
          ) : list.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.04)' }} elevation={0}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
              <Typography color="text.secondary">No notifications found.</Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {list.map((n, i) => {
                const read = viewed.has(n.ID);
                const c = getColor(n.Type);
                return (
                  <Grow in key={n.ID} timeout={200 + i * 60}>
                    <Card onClick={() => markRead(n.ID)} sx={{
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      background: read ? 'rgba(30,41,59,0.4)' : '#1e293b',
                      border: `1px solid ${read ? 'rgba(255,255,255,0.04)' : c.accent + '22'}`,
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        borderColor: c.accent + '55',
                        boxShadow: `0 8px 24px ${c.accent}15`,
                      },
                      '&::before': {
                        content: '""', position: 'absolute', left: 0, top: 0,
                        width: 4, height: '100%',
                        background: read ? 'transparent' : `linear-gradient(180deg, ${c.accent}, ${c.accent}66)`,
                      },
                    }}>
                      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Stack direction="row" alignItems="center" spacing={2}>

                          {/* Priority rank badge */}
                          {tab === 1 && (
                            <Box sx={{
                              width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                              background: `linear-gradient(135deg, ${c.accent}22, ${c.accent}11)`,
                              border: `1px solid ${c.accent}33`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: c.accent }}>
                                #{i + 1}
                              </Typography>
                            </Box>
                          )}

                          {/* Type icon */}
                          <Box sx={{
                            width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                            background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {c.icon}
                          </Box>

                          {/* Content */}
                          <Box flex={1} minWidth={0}>
                            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" mb={0.5}>
                              <Chip label={n.Type} size="small" sx={{
                                height: 22, fontSize: '0.7rem', fontWeight: 700,
                                backgroundColor: c.bg, color: c.accent,
                                border: `1px solid ${c.accent}33`,
                              }} />
                              <Typography variant="caption" color="text.secondary">
                                {timeAgo(n.Timestamp)}
                              </Typography>
                              {!read && (
                                <Chip icon={<NewIcon sx={{ fontSize: '14px !important' }} />}
                                  label="New" size="small" color="primary" variant="outlined"
                                  sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800 }} />
                              )}
                            </Stack>
                            <Typography variant="subtitle1" sx={{
                              fontWeight: 600, fontSize: '0.95rem',
                              color: read ? 'text.secondary' : 'text.primary',
                              textDecoration: read ? 'line-through' : 'none',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {n.Message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.6, fontSize: '0.65rem' }}>
                              {n.Timestamp}
                            </Typography>
                          </Box>

                          {/* Status icon */}
                          {!mobile && (
                            <Box flexShrink={0}>
                              {read ? (
                                <Tooltip title="Read"><ViewedIcon sx={{ color: 'text.secondary', opacity: 0.4 }} /></Tooltip>
                              ) : (
                                <Tooltip title="Mark as read"><CheckIcon sx={{ color: '#818cf8' }} /></Tooltip>
                              )}
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grow>
                );
              })}
            </Stack>
          )}

          {/* ─── PAGINATION ─── */}
          {tab === 0 && !loading && notifs.length > 0 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination count={5} page={page} onChange={(_, v) => setPage(v)}
                color="primary" size="large"
                sx={{ '& .MuiPaginationItem-root': { fontWeight: 600 } }} />
            </Box>
          )}
        </Container>

        {/* ─── FOOTER ─── */}
        <Box sx={{ py: 3, mt: 4, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            Campus Notification Service · Priority Inbox Engine
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
