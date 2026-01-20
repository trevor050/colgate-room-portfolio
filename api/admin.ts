import adminIndex from '@trevor050/dossier/api/admin/index';
import adminAuth from '@trevor050/dossier/api/admin/auth';
import adminBots from '@trevor050/dossier/api/admin/bots';
import adminMap from '@trevor050/dossier/api/admin/map';
import adminOverview from '@trevor050/dossier/api/admin/overview';
import adminReplay from '@trevor050/dossier/api/admin/replay';
import adminSession from '@trevor050/dossier/api/admin/session';
import adminSessions from '@trevor050/dossier/api/admin/sessions';
import adminStatus from '@trevor050/dossier/api/admin/status';
import adminVisitor from '@trevor050/dossier/api/admin/visitor';
import adminVisitors from '@trevor050/dossier/api/admin/visitors';

const routes: Record<string, (req: any, res: any) => any> = {
  '': adminIndex,
  index: adminIndex,
  auth: adminAuth,
  bots: adminBots,
  map: adminMap,
  overview: adminOverview,
  replay: adminReplay,
  session: adminSession,
  sessions: adminSessions,
  status: adminStatus,
  visitor: adminVisitor,
  visitors: adminVisitors,
};

export default function handler(req: any, res: any) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let route = (url.searchParams.get('route') || '').trim();
  route = route.replace(/^\/+/, '').replace(/\/+$/, '');
  if (route.startsWith('admin/')) route = route.slice('admin/'.length);

  const fn = routes[route];
  if (!fn) {
    res.statusCode = 404;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Not Found');
    return;
  }
  return fn(req, res);
}

