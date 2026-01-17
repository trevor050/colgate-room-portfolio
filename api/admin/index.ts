export default function handler(_req: any, res: any) {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.statusCode = 200;
  res.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Portfolio Analytics</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0b1020;
        --panel: rgba(255, 255, 255, 0.06);
        --panel2: rgba(255, 255, 255, 0.04);
        --border: rgba(255, 255, 255, 0.12);
        --text: rgba(255, 255, 255, 0.92);
        --muted: rgba(255, 255, 255, 0.65);
        --gold: #ffd700;
        --red: #fb7185;
        --green: #4ade80;
        --blue: #8ab4f8;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      }
      body { margin: 0; background: radial-gradient(1200px 700px at 30% 10%, #182045, #0b1020); color: var(--text); }
      a { color: var(--blue); }
      .wrap { max-width: 1180px; margin: 0 auto; padding: 24px; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
      h1 { margin: 0; font-size: 18px; letter-spacing: 0.3px; }
      .pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 999px; background: rgba(0,0,0,0.25); color: var(--muted); font-size: 12px; }
      .grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
      .card { border: 1px solid var(--border); border-radius: 14px; background: var(--panel); box-shadow: 0 12px 40px rgba(0,0,0,0.3); overflow: hidden; }
      .card .hd { display: flex; gap: 12px; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.18); }
      .card .bd { padding: 14px 16px; }
      .controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
      .btn { border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text); padding: 8px 10px; border-radius: 10px; cursor: pointer; }
      .btn.active { border-color: rgba(255,215,0,0.35); box-shadow: 0 0 0 3px rgba(255,215,0,0.12); }
      .input { border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text); padding: 8px 10px; border-radius: 10px; min-width: 220px; }
      .row { display: flex; gap: 10px; align-items: center; color: var(--muted); font-size: 13px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 10px 10px; border-bottom: 1px solid rgba(255,255,255,0.08); vertical-align: top; }
      th { color: var(--muted); font-weight: 600; font-size: 12px; }
      tr:hover td { background: rgba(255,255,255,0.03); cursor: pointer; }
      .tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.18); color: var(--muted); font-size: 12px; }
      .tag.good { border-color: rgba(74, 222, 128, 0.25); color: rgba(74, 222, 128, 0.95); }
      .tag.bad { border-color: rgba(251, 113, 133, 0.35); color: rgba(251, 113, 133, 0.95); }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; color: var(--muted); }
      .split { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; }
      @media (max-width: 980px) { .split { grid-template-columns: 1fr; } }
      .pre { white-space: pre-wrap; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px; color: rgba(255,255,255,0.82); font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div>
          <h1>Portfolio Analytics</h1>
          <div class="row">Private dashboard — sessions, events, bot filter</div>
        </div>
        <div class="pill"><span style="color:var(--gold)">●</span> admin</div>
      </header>

      <div class="grid">
        <div class="card">
          <div class="hd">
            <div class="controls">
              <button class="btn active" id="btn-sessions">Sessions</button>
              <button class="btn" id="btn-visitors">Visitors</button>
              <label class="tag"><input id="show-bots" type="checkbox" /> show bots</label>
              <input class="input" id="search" placeholder="Search (IP, org, city, vid)" />
              <input class="input" id="token" type="password" placeholder="Admin token" />
              <button class="btn" id="save-token">Set token</button>
              <button class="btn" id="refresh">Refresh</button>
            </div>
          </div>
          <div class="bd" id="list">Loading…</div>
        </div>

        <div class="card">
          <div class="hd">
            <div class="row">Details</div>
          </div>
          <div class="bd" id="details">Select a session to view details.</div>
        </div>
      </div>
    </div>

    <script>
      const $ = (id) => document.getElementById(id);
      const state = { view: 'sessions', sessions: [], visitors: [], showBots: false, search: '' };

	      function api(path) {
	        const token = localStorage.getItem('admin_token') || '';
	        return fetch(path, { headers: { 'accept': 'application/json', 'authorization': token ? ('Bearer ' + token) : '' } }).then(async (r) => {
	          if (!r.ok) throw new Error(await r.text());
	          return r.json();
	        });
	      }

	      async function loadStatus() {
	        try {
	          const r = await fetch('/api/admin/status', { headers: { 'accept': 'application/json' } });
	          if (!r.ok) return null;
	          return await r.json();
	        } catch {
	          return null;
	        }
	      }

      function fmtDate(value) {
        if (!value) return '';
        try { return new Date(value).toLocaleString(); } catch { return String(value); }
      }

      function str(value) { return value == null ? '' : String(value); }
      function contains(hay, needle) { return str(hay).toLowerCase().includes(needle.toLowerCase()); }

      function matchesSearch(row) {
        if (!state.search) return true;
        const n = state.search.trim().toLowerCase();
        if (!n) return true;
        return (
          contains(row.ip, n) ||
          contains(row.vid, n) ||
          contains(row.sid, n) ||
          contains(row.city, n) ||
          contains(row.region, n) ||
          contains(row.country, n) ||
          contains(row.org, n) ||
          contains(row.asn, n) ||
          contains(row.user_agent, n)
        );
      }

      function renderSessions() {
        const rows = state.sessions.filter(matchesSearch);
        if (!rows.length) { $('list').innerHTML = '<div class="row">No sessions found.</div>'; return; }

        const html = [
          '<table>',
          '<thead><tr>',
          '<th>When</th><th>Loc / Net</th><th>Device</th><th>IP</th><th>Summary</th><th>Flags</th>',
          '</tr></thead>',
          '<tbody>',
          ...rows.map((s) => {
            const flag = s.is_bot ? '<span class="tag bad">bot</span>' : '<span class="tag good">human?</span>';
            const org = s.org ? s.org : '';
            const loc = [s.city, s.region, s.country].filter(Boolean).join(', ');
            const net = [s.asn, s.as_name].filter(Boolean).join(' ');
            const summaryBits = [];
            if (s.active_seconds != null) summaryBits.push('active ' + s.active_seconds + 's');
            if (s.interactions != null) summaryBits.push('actions ' + s.interactions);
            if (s.overlays_unique != null) summaryBits.push('sections ' + s.overlays_unique);
            const summary = summaryBits.join(' • ');
            const device = (s.is_mobile === true ? 'mobile' : 'desktop') + (s.orientation ? ' (' + s.orientation + ')' : '');
            const when = fmtDate(s.started_at);
            return (
              '<tr data-sid=\"' + s.sid + '\">' +
                '<td>' + when + '<div class=\"mono\">' + s.vid_short + '</div></td>' +
                '<td>' + (loc || '') +
                  (org ? '<div class=\"mono\">' + org + '</div>' : (net ? '<div class=\"mono\">' + net + '</div>' : '')) +
                '</td>' +
                '<td>' + device + '</td>' +
                '<td class=\"mono\">' + (s.ip || '') + '</td>' +
                '<td>' + (summary || '<span class=\"mono\">(no summary yet)</span>') + '</td>' +
                '<td>' + flag + '</td>' +
              '</tr>'
            );
          }),
          '</tbody></table>'
        ].join('');

        $('list').innerHTML = html;
        $('list').querySelectorAll('tr[data-sid]').forEach((tr) => {
          tr.addEventListener('click', async () => {
            const sid = tr.getAttribute('data-sid');
            await loadSession(sid);
          });
        });
      }

      function renderVisitors() {
        const rows = state.visitors.filter(matchesSearch);
        if (!rows.length) { $('list').innerHTML = '<div class="row">No visitors found.</div>'; return; }

        const html = [
          '<table>',
          '<thead><tr>',
          '<th>Visitor</th><th>Last seen</th><th>Location / Org</th><th>Last IP</th>',
          '</tr></thead>',
          '<tbody>',
          ...rows.map((v) => {
            const loc = [v.city, v.region, v.country].filter(Boolean).join(', ');
            const org = v.org ? v.org : '';
            return (
              '<tr>' +
                '<td class=\"mono\">' + v.vid + '</td>' +
                '<td>' + fmtDate(v.last_seen_at) + '</td>' +
                '<td>' + (loc || '') + (org ? '<div class=\"mono\">' + org + '</div>' : '') + '</td>' +
                '<td class=\"mono\">' + (v.last_ip || '') + '</td>' +
              '</tr>'
            );
          }),
          '</tbody></table>'
        ].join('');
        $('list').innerHTML = html;
      }

      function render() {
        if (state.view === 'sessions') renderSessions();
        else renderVisitors();
      }

      async function loadSessions() {
        const bots = state.showBots ? '1' : '0';
        const data = await api('/api/admin/sessions?bots=' + bots);
        state.sessions = data.sessions || [];
        render();
      }

      async function loadVisitors() {
        const data = await api('/api/admin/visitors');
        state.visitors = data.visitors || [];
        render();
      }

      async function loadSession(sid) {
        const data = await api('/api/admin/session?sid=' + encodeURIComponent(sid));
        const s = data.session;
        const events = data.events || [];

        const lines = [];
        lines.push('sid: ' + s.sid);
        lines.push('vid: ' + s.vid);
        lines.push('started: ' + fmtDate(s.started_at));
        if (s.ended_at) lines.push('ended: ' + fmtDate(s.ended_at));
        if (s.ip) lines.push('ip: ' + s.ip);
        if (s.location) lines.push('loc: ' + s.location);
        if (s.org) lines.push('org: ' + s.org);
        if (s.net) lines.push('net: ' + s.net);
        if (s.bot_reasons) lines.push('bot: ' + s.bot_score + ' (' + s.bot_reasons + ')');
        if (s.active_seconds != null) lines.push('active_seconds: ' + s.active_seconds);
        if (s.interactions != null) lines.push('interactions: ' + s.interactions);
        if (s.first_interaction_seconds != null) lines.push('first_interaction_seconds: ' + s.first_interaction_seconds);
        if (Array.isArray(s.overlays) && s.overlays.length) lines.push('overlays: ' + s.overlays.map(o => o.key + ':' + o.seconds + 's').join(', '));

        const evText = events.slice(0, 400).map((e) => {
          const t = fmtDate(e.ts);
          const data = e.data ? JSON.stringify(e.data) : '';
          return t + '  ' + e.type + (data ? '  ' + data : '');
        }).join('\\n');

        $('details').innerHTML = '<div class=\"split\">' +
          '<div><div class=\"row\" style=\"margin-bottom:8px\">Session</div><div class=\"pre\">' + lines.join('\\n') + '</div></div>' +
          '<div><div class=\"row\" style=\"margin-bottom:8px\">Events (' + events.length + ')</div><div class=\"pre\">' + (evText || '(none)') + '</div></div>' +
        '</div>';
      }

      $('btn-sessions').addEventListener('click', async () => {
        state.view = 'sessions';
        $('btn-sessions').classList.add('active');
        $('btn-visitors').classList.remove('active');
        await loadSessions();
      });

      $('btn-visitors').addEventListener('click', async () => {
        state.view = 'visitors';
        $('btn-visitors').classList.add('active');
        $('btn-sessions').classList.remove('active');
        await loadVisitors();
      });

      $('show-bots').addEventListener('change', async (e) => {
        state.showBots = e.target.checked;
        if (state.view === 'sessions') await loadSessions();
      });

      $('search').addEventListener('input', (e) => {
        state.search = e.target.value || '';
        render();
      });

      $('refresh').addEventListener('click', async () => {
        if (state.view === 'sessions') await loadSessions();
        else await loadVisitors();
      });

      $('save-token').addEventListener('click', async () => {
        const t = $('token').value || '';
        if (!t) return;
        localStorage.setItem('admin_token', t);
        $('token').value = '';
        if (state.view === 'sessions') await loadSessions();
        else await loadVisitors();
      });

	      // initial load
	      (async () => {
	        const status = await loadStatus();
	        if (status && status.admin_token_configured === false) {
	          $('list').innerHTML = '<div class=\"row\">Set <span class=\"mono\">ADMIN_TOKEN</span> in Vercel env vars, then refresh.</div>';
	          return;
	        }
	        if (status && status.db_configured === false) {
	          $('list').innerHTML = '<div class=\"row\">Set <span class=\"mono\">DATABASE_URL</span> (or <span class=\"mono\">POSTGRES_URL</span>) in Vercel env vars, then refresh.</div>';
	          return;
	        }

	        if (!localStorage.getItem('admin_token')) {
	          $('list').innerHTML = '<div class=\"row\">Enter <span class=\"mono\">ADMIN_TOKEN</span> above to load analytics.</div>';
	          return;
	        }

	        loadSessions().catch((err) => {
	          $('list').innerHTML = '<div class=\"row\" style=\"color:var(--red)\">Failed: ' + (err && err.message ? err.message : err) + '</div>';
	        });
	      })();
	    </script>
	  </body>
	</html>`);
}
