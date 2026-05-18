import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ThemeProvider, createTheme, CssBaseline, Container, Box, Typography,
  Card, CardContent, Button, Tabs, Tab, TextField, Select, MenuItem,
  InputLabel, FormControl, CircularProgress, Alert, Badge, Chip,
  Tooltip, Paper, Pagination, Grow, Stack, useMediaQuery,
} from '@mui/material';
import {
  Notifications as BellIcon, PriorityHigh as PrioIcon,
  CheckCircleOutline as CheckIcon, Refresh as RefreshIcon,
  Star as StarIcon, WorkOutline as PlacementIcon,
  SchoolOutlined as ResultIcon, EventNote as EventIcon,
  FiberManualRecord as DotIcon, CheckCircle as ReadIcon,
} from '@mui/icons-material';

/* ── Google Fonts ── */
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap';
document.head.appendChild(fontLink);

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#a78bfa' },
    secondary: { main: '#22d3ee' },
    background: { default: '#060b18', paper: '#0d1526' },
    text: { primary: '#e2e8f0', secondary: '#64748b' },
  },
  typography: { fontFamily: '"Plus Jakarta Sans", sans-serif' },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

const TYPES: Record<string, { color: string; glow: string; icon: React.ReactNode; label: string }> = {
  placement: { color: '#f59e0b', glow: '#f59e0b40', icon: <PlacementIcon />, label: 'Placement' },
  result:    { color: '#10b981', glow: '#10b98140', icon: <ResultIcon />,    label: 'Result' },
  event:     { color: '#e879f9', glow: '#e879f940', icon: <EventIcon />,     label: 'Event' },
  general:   { color: '#64748b', glow: '#64748b20', icon: <BellIcon />,      label: 'General' },
};

function getType(t: string) {
  const k = t.toLowerCase();
  if (k.includes('placement')) return TYPES.placement;
  if (k.includes('result'))    return TYPES.result;
  if (k.includes('event'))     return TYPES.event;
  return TYPES.general;
}

function ago(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts.replace(' ', 'T')).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface N { ID: string; Type: string; Message: string; Timestamp: string; }

export default function App() {
  const [tab, setTab]         = useState(0);
  const [all, setAll]         = useState<N[]>([]);
  const [prio, setPrio]       = useState<N[]>([]);
  const [limit, setLimit]     = useState(10);
  const [page, setPage]       = useState(1);
  const [filter, setFilter]   = useState('');
  const [topN, setTopN]       = useState(10);
  const [pFilter, setPFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const [read, setRead]       = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('r') || '[]')); } catch { return new Set(); }
  });
  const mobile = useMediaQuery('(max-width:600px)');

  const saveRead = (s: Set<string>) => { setRead(s); localStorage.setItem('r', JSON.stringify([...s])); };
  const mark = (id: string) => { const s = new Set(read); s.add(id); saveRead(s); };
  const markAll = () => { const s = new Set(read); [...all, ...prio].forEach(n => s.add(n.ID)); saveRead(s); };

  const fetchAll = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await axios.get('http://localhost:5000/notifications', {
        params: { limit, page, notification_type: filter || undefined },
      });
      if (r.data?.success) setAll(r.data.notifications);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }, [limit, page, filter]);

  const fetchPrio = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await axios.get('http://localhost:5000/notifications/priority', { params: { n: topN } });
      if (r.data?.success) {
        let d = r.data.notifications as N[];
        if (pFilter) d = d.filter(n => n.Type.toLowerCase() === pFilter.toLowerCase());
        setPrio(d);
      }
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }, [topN, pFilter]);

  useEffect(() => { tab === 0 ? fetchAll() : fetchPrio(); }, [tab, fetchAll, fetchPrio]);

  const list  = tab === 0 ? all : prio;
  const unread = all.filter(n => !read.has(n.ID)).length;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(167,139,250,0.18), transparent), #060b18' }}>

        {/* HEADER */}
        <Box sx={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(34,211,238,0.06) 100%)',
          borderBottom: '1px solid rgba(167,139,250,0.15)', py: { xs: 3, md: 4.5 },
        }}>
          {/* Decorative blobs */}
          <Box sx={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(167,139,250,0.2), transparent)', filter:'blur(40px)', pointerEvents:'none' }} />
          <Box sx={{ position:'absolute', bottom:-40, left:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,211,238,0.15), transparent)', filter:'blur(30px)', pointerEvents:'none' }} />

          <Container maxWidth="lg">
            <Stack direction={mobile ? 'column' : 'row'} alignItems={mobile ? 'flex-start' : 'center'} justifyContent="space-between" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2.5}>
                <Badge badgeContent={unread} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 800, minWidth: 22, height: 22 } }}>
                  <Box sx={{
                    width: 58, height: 58, borderRadius: 3.5,
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 1px rgba(167,139,250,0.3), 0 8px 32px rgba(124,58,237,0.5)',
                  }}>
                    <BellIcon sx={{ color: '#fff', fontSize: 30 }} />
                  </Box>
                </Badge>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.9rem' }, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #e2e8f0 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Campus Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Live feed · Placements, Results &amp; Events
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" size="small" startIcon={<CheckIcon />} onClick={markAll}
                  sx={{ borderColor: 'rgba(167,139,250,0.3)', color: '#a78bfa', '&:hover': { borderColor: '#a78bfa', background: 'rgba(167,139,250,0.08)' } }}>
                  Mark All Read
                </Button>
                <Button variant="contained" size="small" startIcon={<RefreshIcon />}
                  onClick={tab === 0 ? fetchAll : fetchPrio}
                  sx={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', boxShadow: '0 4px 20px rgba(124,58,237,0.5)', '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #818cf8)' } }}>
                  Refresh
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 4 }}>

          {/* TABS */}
          <Paper sx={{
            mb: 3, background: 'rgba(13,21,38,0.8)', border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
          }} elevation={0}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setErr(null); }}
              variant="fullWidth" indicatorColor="primary" textColor="primary"
              sx={{ '& .MuiTab-root': { py: 2, fontWeight: 700, fontSize: '0.9rem', gap: 1 }, '& .MuiTabs-indicator': { height: 3, borderRadius: 2, background: 'linear-gradient(90deg, #7c3aed, #a78bfa)' } }}>
              <Tab icon={<BellIcon />} iconPosition="start" label="All Notifications" />
              <Tab icon={<PrioIcon />} iconPosition="start" label="Priority Inbox" />
            </Tabs>
          </Paper>

          {err && <Alert severity="error" sx={{ mb: 3 }}>{err}</Alert>}

          {/* FILTERS */}
          <Paper sx={{ p: 2.5, mb: 3, background: 'rgba(13,21,38,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }} elevation={0}>
            {tab === 0 ? (
              <Stack direction={mobile ? 'column' : 'row'} spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel>Category</InputLabel>
                  <Select value={filter} label="Category" onChange={e => { setFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="Placement">🏢 Placement</MenuItem>
                    <MenuItem value="Result">📊 Result</MenuItem>
                    <MenuItem value="Event">🎉 Event</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Per Page</InputLabel>
                  <Select value={limit} label="Per Page" onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
                    {[5,10,15,20].map(v => <MenuItem key={v} value={v}>{v} items</MenuItem>)}
                  </Select>
                </FormControl>
                <Box sx={{ ml:'auto', px:2, py:0.8, borderRadius:2, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)' }}>
                  <Typography variant="caption" sx={{ color:'#a78bfa', fontWeight:700 }}>{unread} unread</Typography>
                </Box>
              </Stack>
            ) : (
              <Stack direction={mobile ? 'column' : 'row'} spacing={2} alignItems="center">
                <TextField size="small" label="Top N" type="number" value={topN}
                  onChange={e => setTopN(Math.max(1, Number(e.target.value)))}
                  inputProps={{ min: 1 }} sx={{ width: 110 }} />
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel>Filter Type</InputLabel>
                  <Select value={pFilter} label="Filter Type" onChange={e => setPFilter(e.target.value)}>
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="Placement">🏢 Placement</MenuItem>
                    <MenuItem value="Result">📊 Result</MenuItem>
                    <MenuItem value="Event">🎉 Event</MenuItem>
                  </Select>
                </FormControl>
                <Chip icon={<StarIcon sx={{ color:'#f59e0b !important' }} />} label={`Top ${topN} by Priority`}
                  sx={{ ml:'auto', background:'rgba(245,158,11,0.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.3)', fontWeight:700 }} />
              </Stack>
            )}
          </Paper>

          {/* PRIORITY INFO BANNER */}
          {tab === 1 && (
            <Box sx={{ mb:3, p:2, borderRadius:2, background:'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(34,211,238,0.05))', border:'1px dashed rgba(167,139,250,0.25)', display:'flex', alignItems:'center', gap:1.5 }}>
              <StarIcon sx={{ color:'#a78bfa', fontSize:22 }} />
              <Typography variant="body2" color="text.secondary">
                <strong style={{ color:'#e2e8f0' }}>Min-Heap Engine:</strong> Ranked by weight —{' '}
                <span style={{ color:'#f59e0b', fontWeight:700 }}>Placement(3)</span> &gt;{' '}
                <span style={{ color:'#10b981', fontWeight:700 }}>Result(2)</span> &gt;{' '}
                <span style={{ color:'#e879f9', fontWeight:700 }}>Event(1)</span>, then newest first.
              </Typography>
            </Box>
          )}

          {/* NOTIFICATION CARDS */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={10}><CircularProgress size={40} thickness={4} sx={{ color:'#a78bfa' }} /></Box>
          ) : list.length === 0 ? (
            <Paper sx={{ p:8, textAlign:'center', background:'rgba(13,21,38,0.5)', border:'1px solid rgba(255,255,255,0.04)' }} elevation={0}>
              <BellIcon sx={{ fontSize:56, color:'text.secondary', opacity:0.3, mb:2 }} />
              <Typography color="text.secondary">No notifications found.</Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {list.map((n, i) => {
                const isRead = read.has(n.ID);
                const t = getType(n.Type);
                return (
                  <Grow in key={n.ID} timeout={150 + i * 50}>
                    <Card onClick={() => mark(n.ID)} sx={{
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      background: isRead ? 'rgba(13,21,38,0.4)' : 'rgba(13,21,38,0.85)',
                      border: `1px solid ${isRead ? 'rgba(255,255,255,0.04)' : t.color + '30'}`,
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s ease',
                      opacity: isRead ? 0.55 : 1,
                      '&:hover': !isRead ? {
                        transform: 'translateY(-3px)',
                        border: `1px solid ${t.color}60`,
                        boxShadow: `0 12px 40px ${t.glow}`,
                      } : {},
                      /* left accent bar */
                      '&::before': {
                        content: '""', position: 'absolute', left:0, top:0,
                        width: 4, height: '100%',
                        background: isRead ? 'transparent' : `linear-gradient(180deg, ${t.color}, ${t.color}44)`,
                        borderRadius: '4px 0 0 4px',
                      },
                    }}>
                      <CardContent sx={{ p: { xs:2, md:2.5 }, '&:last-child': { pb:{ xs:2, md:2.5 } } }}>
                        <Stack direction="row" alignItems="center" spacing={2}>

                          {/* Rank badge (Priority view) */}
                          {tab === 1 && (
                            <Box sx={{ flexShrink:0, width:38, height:38, borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg, ${t.color}25, ${t.color}10)`, border:`1px solid ${t.color}30` }}>
                              <Typography sx={{ fontWeight:800, fontSize:'0.82rem', color:t.color }}>#{i+1}</Typography>
                            </Box>
                          )}

                          {/* Icon */}
                          <Box sx={{ flexShrink:0, width:44, height:44, borderRadius:2.5, display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg, ${t.color}20, ${t.color}08)`, border:`1px solid ${t.color}25`, color:t.color, boxShadow: isRead ? 'none' : `0 0 12px ${t.glow}` }}>
                            {React.cloneElement(t.icon as React.ReactElement, { sx: { fontSize:22 } })}
                          </Box>

                          {/* Content */}
                          <Box flex={1} minWidth={0}>
                            <Stack direction="row" alignItems="center" spacing={1} mb={0.6} flexWrap="wrap">
                              <Chip label={t.label} size="small" sx={{ height:22, fontSize:'0.68rem', fontWeight:800, background:`${t.color}18`, color:t.color, border:`1px solid ${t.color}30`, letterSpacing:'0.04em' }} />
                              {!isRead && <DotIcon sx={{ fontSize:8, color:'#a78bfa' }} />}
                              <Typography variant="caption" color="text.secondary">{ago(n.Timestamp)}</Typography>
                            </Stack>
                            <Typography sx={{ fontWeight:700, fontSize:'1rem', color: isRead ? 'text.secondary' : 'text.primary', textDecoration: isRead ? 'line-through' : 'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
                              {n.Message}
                            </Typography>
                            <Typography variant="caption" sx={{ color:'text.secondary', opacity:0.5, fontSize:'0.65rem' }}>
                              {n.Timestamp}
                            </Typography>
                          </Box>

                          {/* Read status */}
                          {!mobile && (
                            <Tooltip title={isRead ? 'Read' : 'Click to mark as read'}>
                              <Box sx={{ flexShrink:0, color: isRead ? 'text.secondary' : '#a78bfa', opacity: isRead ? 0.3 : 0.8 }}>
                                {isRead ? <ReadIcon fontSize="small" /> : <DotIcon sx={{ fontSize:14 }} />}
                              </Box>
                            </Tooltip>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grow>
                );
              })}
            </Stack>
          )}

          {/* PAGINATION */}
          {tab === 0 && !loading && all.length > 0 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination count={5} page={page} onChange={(_, v) => setPage(v)} color="primary" size="large"
                sx={{ '& .MuiPaginationItem-root': { fontWeight:700 }, '& .Mui-selected': { background:'linear-gradient(135deg, #7c3aed, #a78bfa) !important' } }} />
            </Box>
          )}
        </Container>

        {/* FOOTER */}
        <Box sx={{ py:3, mt:2, borderTop:'1px solid rgba(255,255,255,0.04)', textAlign:'center' }}>
          <Typography variant="caption" color="text.secondary">
            Campus Notification Service · Priority Inbox Engine
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
