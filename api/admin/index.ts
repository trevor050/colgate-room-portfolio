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
      :root{
        color-scheme: dark;
        --bg:#0b1020;
        --panel:rgba(255,255,255,.06);
        --border:rgba(255,255,255,.12);
        --text:rgba(255,255,255,.92);
        --muted:rgba(255,255,255,.65);
        --gold:#ffd700;
        --red:#fb7185;
        --green:#4ade80;
        --blue:#8ab4f8;
        font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji";
      }
      body{margin:0;background:radial-gradient(1200px 700px at 30% 10%,#182045,#0b1020);color:var(--text)}
      .wrap{max-width:1180px;margin:0 auto;padding:24px}
      header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}
      h1{margin:0;font-size:18px;letter-spacing:.3px}
      .pill{display:inline-flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);border-radius:999px;background:rgba(0,0,0,.25);color:var(--muted);font-size:12px}
      .grid{display:grid;grid-template-columns:1fr;gap:14px}
      .card{border:1px solid var(--border);border-radius:14px;background:var(--panel);box-shadow:0 12px 40px rgba(0,0,0,.3);overflow:hidden}
      .hd{display:flex;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border);background:rgba(0,0,0,.18)}
      .bd{padding:14px 16px}
      .controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
      .btn{border:1px solid var(--border);background:rgba(0,0,0,.2);color:var(--text);padding:8px 10px;border-radius:10px;cursor:pointer}
      .btn.active{border-color:rgba(255,215,0,.35);box-shadow:0 0 0 3px rgba(255,215,0,.12)}
      .input{border:1px solid var(--border);background:rgba(0,0,0,.2);color:var(--text);padding:8px 10px;border-radius:10px;min-width:240px}
      .row{display:flex;gap:10px;align-items:center;color:var(--muted);font-size:13px}
      table{width:100%;border-collapse:collapse}
      th,td{text-align:left;padding:10px 10px;border-bottom:1px solid rgba(255,255,255,.08);vertical-align:top}
      th{color:var(--muted);font-weight:600;font-size:12px}
      tr:hover td{background:rgba(255,255,255,.03);cursor:pointer}
      .tag{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.18);color:var(--muted);font-size:12px}
      .tag.good{border-color:rgba(74,222,128,.25);color:rgba(74,222,128,.95)}
      .tag.bad{border-color:rgba(251,113,133,.35);color:rgba(251,113,133,.95)}
      .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:12px;color:var(--muted)}
      .pre{white-space:pre-wrap;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px;color:rgba(255,255,255,.82);font-size:12px}
      .center{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
      .auth{max-width:560px;width:100%}
      .auth h2{margin:0 0 10px 0;font-size:16px}
      .auth p{margin:0 0 16px 0;color:var(--muted);font-size:13px}
      .kpis{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
      .kpi{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.14);border-radius:12px;padding:10px 12px;min-width:160px}
      .kpi .n{font-size:16px;color:var(--text);font-weight:700}
      .kpi .l{font-size:12px;color:var(--muted);margin-top:2px}
      .timeline{display:grid;gap:8px}
      .evt{display:grid;grid-template-columns:72px 1fr;gap:10px;padding:10px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.18);border-radius:12px}
      .evt .t{color:var(--muted);font-size:12px}
      .evt .h{font-size:13px;color:var(--text);font-weight:650}
      .evt .d{font-size:12px;color:var(--muted);margin-top:2px}
    </style>
  </head>
  <body>
    <div id="authRoot" class="center">
      <div class="card auth">
        <div class="hd"><div class="row">Admin panel authentication</div></div>
        <div class="bd">
          <h2>Enter admin token</h2>
          <p>This dashboard stays hidden until a valid token is provided.</p>
          <div class="controls">
            <input class="input" id="token" type="password" placeholder="ADMIN_TOKEN" />
            <button class="btn" id="continue">Continue</button>
            <button class="btn" id="forget" style="display:none">Forget</button>
          </div>
          <div class="row" id="authMsg" style="margin-top:10px"></div>
        </div>
      </div>
    </div>

    <div id="appRoot" style="display:none">
	      <div class="wrap">
	        <header>
	          <div>
	            <h1>Analytics</h1>
	            <div class="row">First-party tracker dashboard</div>
	          </div>
	          <div class="controls">
	            <button class="btn" id="logout">Logout</button>
	          </div>
	        </header>

        <div class="grid">
          <div class="card">
	            <div class="hd">
	              <div class="controls">
	                <button class="btn active" id="btnDashboard">Dashboard</button>
	                <button class="btn" id="btnSessions">Sessions</button>
	                <button class="btn" id="btnVisitors">Visitors</button>
	                <button class="btn" id="btnBots">Bots</button>
	                <button class="btn" id="btnMap">Map</button>
	                <button class="btn" id="btnSettings">Settings</button>
	                <label class="tag" id="showBotsWrap" style="display:none"><input id="showBots" type="checkbox" /> include bots</label>
	                <input class="input" id="search" placeholder="Search…" />
	                <button class="btn" id="refresh">Refresh</button>
	              </div>
	            </div>
            <div class="bd" id="list">Loading…</div>
          </div>

          <div class="card">
	            <div class="hd">
	              <div class="controls" style="width:100%">
	                <div class="row" style="flex:1">Details</div>
	                <label class="tag" id="rawWrap" style="display:none"><input id="rawToggle" type="checkbox" /> raw</label>
	              </div>
	            </div>
            <div class="bd" id="details">Select a session to view details.</div>
          </div>
        </div>
      </div>
    </div>

    <script>
      const $ = (id) => document.getElementById(id);
	      const state = { authed:false, view:'dashboard', sessions:[], visitors:[], showBots:false, search:'', raw:false, selectedSid:null, selectedVid:null, overview:null, bots:null, map:null };

      function readCookie(name){
        const m=document.cookie.match(new RegExp('(?:^|; )'+name.replace(/[.$?*|{}()\\[\\]\\\\\\/\\+^]/g,'\\\\$&')+'=([^;]*)'));
        return m?decodeURIComponent(m[1]):'';
      }
      function writeCookie(name,value){
        const secure=location.protocol==='https:'?'; Secure':'';
        document.cookie=name+'='+encodeURIComponent(value)+'; Max-Age=31536000; Path=/api/admin; SameSite=Strict'+secure;
      }
      function clearCookie(name){
        const secure=location.protocol==='https:'?'; Secure':'';
        document.cookie=name+'=; Max-Age=0; Path=/api/admin; SameSite=Strict'+secure;
      }
      function getToken(){ return readCookie('admin_token') || localStorage.getItem('admin_token') || ''; }
      function setToken(t){ localStorage.setItem('admin_token',t); writeCookie('admin_token',t); }
      function forgetToken(){ localStorage.removeItem('admin_token'); clearCookie('admin_token'); }

      async function loadStatus(){
        try{
          const r=await fetch('/api/admin/status',{headers:{accept:'application/json'}});
          if(!r.ok) return null;
          return await r.json();
        }catch{ return null; }
      }
      async function checkAuth(token){
        try{
          const r=await fetch('/api/admin/auth',{headers:{authorization: token?('Bearer '+token):''}});
          return r.status===204;
        }catch{ return false; }
      }

      function showAuth(msg,isErr){
        $('authMsg').textContent=msg||'';
        $('authMsg').style.color=isErr?'var(--red)':'var(--muted)';
        $('forget').style.display=getToken()?'':'none';
      }
      function showApp(){
        $('authRoot').style.display='none';
        $('appRoot').style.display='';
      }

      function api(path){
        const token=getToken();
        return fetch(path,{headers:{accept:'application/json',authorization: token?('Bearer '+token):''}}).then(async (r)=>{
          if(!r.ok) throw new Error(await r.text());
          return r.json();
        });
      }

      function fmtDate(v){ if(!v) return ''; try{ return new Date(v).toLocaleString(); }catch{ return String(v); } }
      function fmtTime(v){ if(!v) return ''; try{ return new Date(v).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}); }catch{ return ''; } }
      function fmtSec(v){
        if(v==null || Number.isNaN(Number(v))) return '—';
        const n=Math.round(Number(v));
        if(n<60) return n+'s';
        const m=Math.floor(n/60), s=n%60;
        return m+'m '+s+'s';
      }
      function str(v){ return v==null?'':String(v); }
      function contains(h,n){ return str(h).toLowerCase().includes(String(n).toLowerCase()); }

      function matchesSearch(row){
        if(!state.search) return true;
        const n=state.search.trim().toLowerCase();
        if(!n) return true;
        return (
          contains(row.ip,n) ||
          contains(row.ptr,n) ||
          contains(row.display_name,n) ||
          contains(row.vid,n) ||
          contains(row.sid,n) ||
          contains(row.city,n) ||
          contains(row.region,n) ||
          contains(row.country,n) ||
          contains(row.org,n) ||
          contains(row.asn,n) ||
          contains(row.user_agent,n)
        );
      }

      function renderSessions(){
        const rows=state.sessions.filter(matchesSearch);
        if(!rows.length){ $('list').innerHTML='<div class=\"row\">No sessions found.</div>'; return; }
        const html=[
          '<table>',
          '<thead><tr>',
          '<th>When</th><th>Where</th><th>Identity</th><th>Device</th><th>Summary</th><th>Flags</th>',
          '</tr></thead>',
          '<tbody>',
          ...rows.map((s)=>{
            const flag=s.is_bot?'<span class=\"tag bad\">bot</span>':'<span class=\"tag good\">human?</span>';
            const loc=[s.city,s.region,s.country].filter(Boolean).join(', ');
            const net=[s.asn,s.as_name].filter(Boolean).join(' ');
            const where=loc || (net?net:'');
            const who=s.org || s.ptr || s.ip || '';
            const summaryBits=[];
            if(s.active_seconds!=null) summaryBits.push('active '+fmtSec(s.active_seconds));
            if(s.idle_seconds!=null) summaryBits.push('idle '+fmtSec(s.idle_seconds));
            if(s.session_seconds!=null) summaryBits.push('total '+fmtSec(s.session_seconds));
            if(s.interactions!=null) summaryBits.push('actions '+s.interactions);
            if(s.overlays_unique!=null) summaryBits.push('sections '+s.overlays_unique);
            const device=(s.is_mobile===true?'mobile':'desktop')+(s.orientation?' ('+s.orientation+')':'');
            return (
              '<tr data-sid=\"'+s.sid+'\">'+
                '<td>'+fmtDate(s.started_at)+
                  '<div class=\"mono\">'+(s.display_name || s.vid_short || '')+'</div>'+
                  (s.display_name ? ('<div class=\"mono\">'+(s.vid_short||'')+'</div>') : '')+
                '</td>'+
                '<td>'+(where||'<span class=\"mono\">(unknown)</span>')+'</td>'+
                '<td>'+(who?('<div class=\"mono\">'+who+'</div>'):'<span class=\"mono\">(unknown)</span>')+'</td>'+
                '<td>'+device+'</td>'+
                '<td>'+(summaryBits.join(' • ')||'<span class=\"mono\">(no summary yet)</span>')+'</td>'+
                '<td>'+flag+'</td>'+
              '</tr>'
            );
          }),
          '</tbody></table>'
        ].join('');
        $('list').innerHTML=html;
        $('list').querySelectorAll('tr[data-sid]').forEach((tr)=>{
          tr.addEventListener('click', async ()=>{
            const sid=tr.getAttribute('data-sid');
            await loadSession(sid);
          });
        });
      }

      function renderVisitors(){
        const rows=state.visitors.filter(matchesSearch);
        if(!rows.length){ $('list').innerHTML='<div class=\"row\">No visitors found.</div>'; return; }
        const html=[
          '<table>',
          '<thead><tr>',
          '<th>Visitor</th><th>Sessions</th><th>Last seen</th><th>Identity</th><th>Last IP</th>',
          '</tr></thead>',
          '<tbody>',
          ...rows.map((v)=>{
            const loc=[v.city,v.region,v.country].filter(Boolean).join(', ');
            const who=v.org || v.ptr || (loc?loc:'');
            return (
              '<tr data-vid=\"'+v.vid+'\">'+
                '<td>'+('<div class=\"mono\">'+(v.display_name||v.vid.slice(0,8))+'</div>')+
                  '<div class=\"mono\">'+v.vid.slice(0,8)+'</div>'+
                '</td>'+
                '<td>'+(v.sessions!=null?String(v.sessions):'—')+'</td>'+
                '<td>'+fmtDate(v.last_seen_at)+'</td>'+
                '<td>'+(who?('<div class=\"mono\">'+who+'</div>'):'<span class=\"mono\">(unknown)</span>')+'</td>'+
                '<td class=\"mono\">'+(v.last_ip||'')+'</td>'+
              '</tr>'
            );
          }),
          '</tbody></table>'
        ].join('');
        $('list').innerHTML=html;
        $('list').querySelectorAll('tr[data-vid]').forEach((tr)=>{
          tr.addEventListener('click', async ()=>{
            const vid=tr.getAttribute('data-vid');
            if(vid) await loadVisitor(vid);
          });
        });
      }

      function sparkline(points){
        const w=520, h=80, pad=6;
        const xs=points.map(p=>p.x), ys=points.map(p=>p.y);
        const minX=Math.min(...xs), maxX=Math.max(...xs);
        const minY=Math.min(...ys), maxY=Math.max(...ys);
        const sx=(x)=> pad + (maxX===minX?0:((x-minX)/(maxX-minX)))*(w-2*pad);
        const sy=(y)=> h-pad - (maxY===minY?0:((y-minY)/(maxY-minY)))*(h-2*pad);
        const d=points.map((p,i)=>(i===0?'M':'L')+sx(p.x).toFixed(1)+','+sy(p.y).toFixed(1)).join(' ');
        return '<svg viewBox=\"0 0 '+w+' '+h+'\" width=\"100%\" height=\"80\" style=\"display:block\">'+
          '<path d=\"'+d+'\" fill=\"none\" stroke=\"rgba(255,215,0,.7)\" stroke-width=\"2\" />'+
        '</svg>';
      }

      function renderDashboard(){
        const o=state.overview;
        if(!o){ $('list').innerHTML='<div class=\"row\">Loading…</div>'; $('details').innerHTML=''; return; }

        const totals=o.totals||{};
        const kpis=[
          ['DAU', String(o.dau||0)],
          ['WAU', String(o.wau||0)],
          ['MAU', String(o.mau||0)],
          ['Visitors', String(totals.visitors||0)],
          ['Human sessions', String(totals.sessions_human||0)],
          ['Events', String(totals.events||0)],
          ['Returning (30d)', String(o.returning_visitors_30d||0)],
        ].map(([l,n])=>'<div class=\"kpi\"><div class=\"n\">'+n+'</div><div class=\"l\">'+l+'</div></div>').join('');

        const byDay=(o.by_day_30d||[]).map((r,i)=>({x:i,y:Number(r.sessions||0)}));
        const chart=byDay.length>=2 ? sparkline(byDay) : '';

        $('list').innerHTML=
          '<div class=\"row\" style=\"margin-bottom:8px\">Last 30 days</div>'+
          '<div class=\"kpis\">'+kpis+'</div>'+
          (chart?('<div style=\"margin-top:10px\">'+chart+'</div>'):'');

        const ref=(o.top_referrers_30d||[]).slice(0,10).map(r=>'<tr><td class=\"mono\">'+(r.host||'')+'</td><td>'+r.sessions+'</td></tr>').join('');
        const pages=(o.top_pages_30d||[]).slice(0,10).map(r=>'<tr><td class=\"mono\">'+(r.page||'')+'</td><td>'+r.sessions+'</td></tr>').join('');
        const opens=(o.top_overlays_open_30d||[]).slice(0,10).map(r=>'<tr><td class=\"mono\">'+(r.overlay||'(unknown)')+'</td><td>'+r.opens+'</td></tr>').join('');
        const dwell=(o.top_overlays_dwell_30d||[]).slice(0,10).map(r=>'<tr><td class=\"mono\">'+(r.overlay||'(unknown)')+'</td><td>'+fmtSec(r.dwell_s||0)+'</td></tr>').join('');

        $('details').innerHTML=
          '<div class=\"split\">'+
            '<div><div class=\"row\" style=\"margin-bottom:8px\">Top referrers</div>'+ (ref?('<table><thead><tr><th>Host</th><th>Sessions</th></tr></thead><tbody>'+ref+'</tbody></table>'):'<div class=\"row\">None</div>') +'</div>'+
            '<div><div class=\"row\" style=\"margin-bottom:8px\">Top pages</div>'+ (pages?('<table><thead><tr><th>Page</th><th>Sessions</th></tr></thead><tbody>'+pages+'</tbody></table>'):'<div class=\"row\">None</div>') +'</div>'+
          '</div>'+
          '<div class=\"split\" style=\"margin-top:12px\">'+
            '<div><div class=\"row\" style=\"margin-bottom:8px\">Sections opened</div>'+ (opens?('<table><thead><tr><th>Section</th><th>Opens</th></tr></thead><tbody>'+opens+'</tbody></table>'):'<div class=\"row\">None</div>') +'</div>'+
            '<div><div class=\"row\" style=\"margin-bottom:8px\">Time in sections</div>'+ (dwell?('<table><thead><tr><th>Section</th><th>Time</th></tr></thead><tbody>'+dwell+'</tbody></table>'):'<div class=\"row\">None</div>') +'</div>'+
          '</div>';
      }

      function renderBots(){
        const b=state.bots;
        if(!b){ $('list').innerHTML='<div class=\"row\">Loading…</div>'; $('details').innerHTML=''; return; }
        const reasons=(b.reasons||[]).slice(0,12).map(r=>'<tr><td class=\"mono\">'+r.reason+'</td><td>'+r.count+'</td></tr>').join('');
        const uas=(b.user_agents||[]).slice(0,10).map(r=>'<tr><td class=\"mono\">'+(r.user_agent||'')+'</td><td>'+r.count+'</td></tr>').join('');
        const sessions=(b.sessions||[]);
        $('list').innerHTML=
          '<div class=\"row\" style=\"margin-bottom:8px\">Bot sessions (last '+b.days+' days)</div>'+
          (sessions.length?(
            '<table><thead><tr><th>When</th><th>Where</th><th>Identity</th><th>Score</th></tr></thead><tbody>'+
              sessions.map((s)=>'<tr data-sid=\"'+s.sid+'\"><td>'+fmtDate(s.started_at)+'</td><td>'+[s.city,s.region,s.country].filter(Boolean).join(', ')+'</td><td class=\"mono\">'+(s.ptr||s.ip||'')+'</td><td>'+(s.bot_score||0)+'</td></tr>').join('')+
            '</tbody></table>'
          ):'<div class=\"row\">No bot sessions.</div>');
        $('list').querySelectorAll('tr[data-sid]').forEach((tr)=>{
          tr.addEventListener('click', async ()=>{
            const sid=tr.getAttribute('data-sid');
            if(sid) await loadSession(sid);
          });
        });
        $('details').innerHTML=
          '<div class=\"split\">'+
            '<div><div class=\"row\" style=\"margin-bottom:8px\">Top reasons</div>'+ (reasons?('<table><thead><tr><th>Reason</th><th>Count</th></tr></thead><tbody>'+reasons+'</tbody></table>'):'<div class=\"row\">None</div>') +'</div>'+
            '<div><div class=\"row\" style=\"margin-bottom:8px\">Top user agents</div>'+ (uas?('<table><thead><tr><th>UA</th><th>Count</th></tr></thead><tbody>'+uas+'</tbody></table>'):'<div class=\"row\">None</div>') +'</div>'+
          '</div>'+
          '<div class=\"row\" style=\"margin-top:10px\">Tip: adjust sensitivity with <span class=\"mono\">BOT_SCORE_THRESHOLD</span> env var.</div>';
      }

      function renderMap(){
        const m=state.map;
        if(!m){ $('list').innerHTML='<div class=\"row\">Loading…</div>'; $('details').innerHTML=''; return; }
        const points=m.points||[];
        const w=900, h=450;
        function proj(p){
          const x=(p.lon+180)/360*w;
          const y=(90-p.lat)/180*h;
          return {x,y};
        }
        const svg=[
          '<div class=\"row\" style=\"margin-bottom:8px\">Map (click a dot)</div>',
          '<svg id=\"mapSvg\" viewBox=\"0 0 '+w+' '+h+'\" width=\"100%\" height=\"450\" style=\"border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(0,0,0,.18)\">',
            '<g opacity=\"0.25\">',
              ...Array.from({length:9}).map((_,i)=>'<line x1=\"0\" y1=\"'+(i*h/8)+'\" x2=\"'+w+'\" y2=\"'+(i*h/8)+'\" stroke=\"white\" stroke-width=\"1\" />'),
              ...Array.from({length:13}).map((_,i)=>'<line x1=\"'+(i*w/12)+'\" y1=\"0\" x2=\"'+(i*w/12)+'\" y2=\"'+h+'\" stroke=\"white\" stroke-width=\"1\" />'),
            '</g>',
            '<g>',
              ...points.map((p)=>{
                const q=proj(p);
                const r=Math.max(3, Math.min(10, 2+Math.log2((p.sessions||1)+1)));
                const label=(p.display_name||p.vid||'').replace(/\"/g,'');
                return '<circle data-vid=\"'+p.vid+'\" cx=\"'+q.x.toFixed(1)+'\" cy=\"'+q.y.toFixed(1)+'\" r=\"'+r+'\" fill=\"rgba(255,215,0,.75)\" stroke=\"rgba(0,0,0,.35)\" stroke-width=\"1\"><title>'+label+'</title></circle>';
              }).join(''),
            '</g>',
          '</svg>'
        ].join('');
        $('list').innerHTML=svg;
        $('list').querySelectorAll('circle[data-vid]').forEach((c)=>{
          c.addEventListener('click', async (e)=>{
            e.stopPropagation();
            const vid=c.getAttribute('data-vid');
            if(vid) await loadVisitor(vid);
          });
        });
        $('details').innerHTML='<div class=\"row\">Click a dot to open the visitor timeline.</div>';
      }

      function renderSettings(){
        $('list').innerHTML=
          '<div class=\"row\">Tracker settings (for open source)</div>'+
          '<div class=\"pre\" style=\"margin-top:10px\">'+
            'Required env vars:\\n'+
            '  DATABASE_URL (or POSTGRES_URL*)\\n'+
            '  ADMIN_TOKEN\\n\\n'+
            'Optional:\\n'+
            '  IPINFO_TOKEN\\n'+
            '  BOT_SCORE_THRESHOLD (default 6)\\n\\n'+
            'Client options (Vite):\\n'+
            '  VITE_TRACKER_ENDPOINT=/api/collect\\n'+
            '  VITE_TRACKER_PERSIST=localStorage|cookie\\n'+
          '</div>';
        $('details').innerHTML='<div class=\"row\">More docs: <span class=\"mono\">tracker/README.md</span></div>';
      }

      function render(){
        if(state.view==='dashboard') return renderDashboard();
        if(state.view==='sessions') return renderSessions();
        if(state.view==='visitors') return renderVisitors();
        if(state.view==='bots') return renderBots();
        if(state.view==='map') return renderMap();
        if(state.view==='settings') return renderSettings();
      }

      async function loadOverview(){
        const data=await api('/api/admin/overview');
        state.overview=data;
        render();
      }
      async function loadSessions(){
        const bots=state.showBots?'1':'0';
        const data=await api('/api/admin/sessions?bots='+bots);
        state.sessions=data.sessions||[];
        render();
      }
      async function loadVisitors(){
        const data=await api('/api/admin/visitors');
        state.visitors=data.visitors||[];
        render();
      }
      async function loadBots(){
        const data=await api('/api/admin/bots?days=30');
        state.bots=data;
        render();
      }
      async function loadMap(){
        const data=await api('/api/admin/map');
        state.map=data;
        render();
      }

      async function loadVisitor(vid){
        state.selectedVid=vid;
        state.selectedSid=null;
        $('rawWrap').style.display='none';
        const data=await api('/api/admin/visitor?vid='+encodeURIComponent(vid));
        const v=data.visitor;
        const sessions=data.sessions||[];

        const loc=[v.city,v.region,v.country].filter(Boolean).join(', ');
        const ident=v.org || v.ptr || v.last_ip || '';
        const header=
          '<div class=\"row\" style=\"margin-bottom:10px\">'+
            '<span class=\"tag good\">visitor</span>'+
            '<span class=\"mono\">'+(v.display_name||v.vid.slice(0,8))+'</span>'+
          '</div>'+
          '<div class=\"row\" style=\"margin-bottom:10px\">'+
            (loc?('<span>Location: <span class=\"mono\">'+loc+'</span></span>'):'')+
            (ident?('<span>Identity: <span class=\"mono\">'+ident+'</span></span>'):'')+
          '</div>'+
          '<div class=\"row\" style=\"margin-bottom:10px\">'+
            '<span>First: <span class=\"mono\">'+fmtDate(v.first_seen_at)+'</span></span>'+
            '<span>Last: <span class=\"mono\">'+fmtDate(v.last_seen_at)+'</span></span>'+
          '</div>'+
          '<div class=\"controls\" style=\"margin:10px 0\">'+
            '<input class=\"input\" id=\"dnInput\" value=\"'+(v.display_name||'').replace(/\"/g,'')+'\" placeholder=\"Display name\" />'+
            '<button class=\"btn\" id=\"dnSave\">Save name</button>'+
          '</div>';

        const rows=sessions.map((s)=> {
          const where=[s.city,s.region,s.country].filter(Boolean).join(', ');
          const sum=[];
          if(s.active_seconds!=null) sum.push('active '+fmtSec(s.active_seconds));
          if(s.idle_seconds!=null) sum.push('idle '+fmtSec(s.idle_seconds));
          if(s.session_seconds!=null) sum.push('total '+fmtSec(s.session_seconds));
          if(s.interactions!=null) sum.push('actions '+s.interactions);
          if(s.overlays_unique!=null) sum.push('sections '+s.overlays_unique);
          return '<tr data-sid=\"'+s.sid+'\"><td>'+fmtDate(s.started_at)+'</td><td>'+(where||'')+'</td><td class=\"mono\">'+(s.ptr||s.ip||'')+'</td><td>'+ (sum.join(' • ')||'') +'</td></tr>';
        }).join('');

        $('details').innerHTML=header+
          '<div class=\"row\" style=\"margin:12px 0 8px\">Sessions</div>'+
          (rows?('<table><thead><tr><th>When</th><th>Where</th><th>Identity</th><th>Summary</th></tr></thead><tbody>'+rows+'</tbody></table>'):'<div class=\"row\">No sessions.</div>');

        const saveBtn=$('dnSave');
        if(saveBtn){
          saveBtn.addEventListener('click', async ()=>{
            const token=getToken();
            const val=($('dnInput') && $('dnInput').value) ? $('dnInput').value : '';
            try{
              const r=await fetch('/api/admin/visitor_update',{
                method:'POST',
                headers:{
                  'content-type':'application/json',
                  'accept':'application/json',
                  'authorization': token?('Bearer '+token):''
                },
                body: JSON.stringify({ vid: v.vid, display_name: val })
              });
              if(!r.ok) throw new Error(await r.text());
              // Refresh visitors list names in the background.
              void loadVisitors();
            }catch{
              // ignore
            }
          });
        }
        $('details').querySelectorAll('tr[data-sid]').forEach((tr)=>{
          tr.addEventListener('click', async ()=>{
            const sid=tr.getAttribute('data-sid');
            if(sid) await loadSession(sid);
          });
        });
      }

      function humanizeEvent(e){
        const type=e.type;
        const d=e.data || {};
        const get=(k)=> (d && typeof d==='object') ? d[k] : undefined;
        const t=fmtTime(e.ts);

        if(type==='visit'){
          const sw=get('screen_w'), sh=get('screen_h'), dpr=get('device_pixel_ratio');
          const detail=(sw && sh) ? ('screen '+sw+'×'+sh+(dpr?(' @'+dpr+'x'):'') ) : '';
          return {t,h:'Visit',d:detail};
        }
        if(type==='mobile_warning_shown') return {t,h:'Mobile banner shown',d:get('reason')?('reason: '+get('reason')):''};
        if(type==='rotate_prompt_shown') return {t,h:'Rotate prompt shown',d:get('reason')?('reason: '+get('reason')):''};
        if(type==='rotate_prompt_dismissed') return {t,h:'Rotate prompt dismissed',d:get('reason')?('reason: '+get('reason')):''};
        if(type==='click_target') return {t,h:'Click',d:get('target')?('target: '+get('target')):''};
        if(type==='hover_start') return {t,h:'Hover start',d:get('target')?('target: '+get('target')):''};
        if(type==='hover_end'){
          const sec=get('seconds');
          const bits=[];
          if(get('target')) bits.push('target: '+get('target'));
          if(sec!=null) bits.push(sec+'s');
          return {t,h:'Hover',d:bits.join(' • ')};
        }
        if(type==='open_overlay') return {t,h:'Open section',d:get('overlay')?('section: '+get('overlay')):''};
        if(type==='close_overlay'){
          const bits=[];
          if(get('overlay')) bits.push('section: '+get('overlay'));
          if(get('reason')) bits.push('reason: '+get('reason'));
          if(get('dwell_s')!=null) bits.push('dwell: '+get('dwell_s')+'s');
          if(get('max_scroll_pct')!=null) bits.push('scroll: '+get('max_scroll_pct')+'%');
          if(get('max_scroll_speed_px_s')!=null) bits.push('speed: '+Math.round(get('max_scroll_speed_px_s'))+'px/s');
          return {t,h:'Close section',d:bits.join(' • ')};
        }
        return {t,h:type,d:e.data ? JSON.stringify(e.data) : ''};
      }

      async function loadSession(sid){
        state.selectedSid=sid;
        const rawWrap=$('rawWrap');
        if(rawWrap) rawWrap.style.display = (state.view==='sessions' || state.view==='bots') ? '' : 'none';
        const data=await api('/api/admin/session?sid='+encodeURIComponent(sid));
        const s=data.session;
        const events=data.events||[];

        const headerBits=[];
        headerBits.push('<div class=\"row\" style=\"margin-bottom:10px\">'+
          '<span class=\"tag '+(s.is_bot?'bad':'good')+'\">'+(s.is_bot?'bot':'human?')+'</span>'+
          (s.display_name?('<span class=\"mono\">'+s.display_name+'</span>'):'')+
          '<span class=\"mono\">'+s.sid+'</span>'+
        '</div>');
        headerBits.push('<div class=\"row\" style=\"margin-bottom:10px\">'+
          '<span>Started: <span class=\"mono\">'+fmtDate(s.started_at)+'</span></span>'+
          (s.ended_at?('<span>Ended: <span class=\"mono\">'+fmtDate(s.ended_at)+'</span></span>'):'')+
        '</div>');
        headerBits.push('<div class=\"row\" style=\"margin-bottom:10px\">'+
          (s.location?('<span>Location: <span class=\"mono\">'+s.location+'</span></span>'):'')+
          (s.org?('<span>Org: <span class=\"mono\">'+s.org+'</span></span>'):'')+
        '</div>');
        headerBits.push('<div class=\"row\" style=\"margin-bottom:10px\">'+
          (s.ptr?('<span>PTR: <span class=\"mono\">'+s.ptr+'</span></span>'):'')+
          (s.ip?('<span>IP: <span class=\"mono\">'+s.ip+'</span></span>'):'')+
        '</div>');

        const kpis=[];
        kpis.push('<div class=\"kpi\"><div class=\"n\">'+fmtSec(s.active_seconds)+'</div><div class=\"l\">active time</div></div>');
        if (s.idle_seconds != null) kpis.push('<div class=\"kpi\"><div class=\"n\">'+fmtSec(s.idle_seconds)+'</div><div class=\"l\">idle time</div></div>');
        if (s.session_seconds != null) kpis.push('<div class=\"kpi\"><div class=\"n\">'+fmtSec(s.session_seconds)+'</div><div class=\"l\">total time</div></div>');
        kpis.push('<div class=\"kpi\"><div class=\"n\">'+(s.interactions!=null?s.interactions:'—')+'</div><div class=\"l\">actions</div></div>');
        kpis.push('<div class=\"kpi\"><div class=\"n\">'+(Array.isArray(s.overlays)?s.overlays.length:0)+'</div><div class=\"l\">sections visited</div></div>');
        kpis.push('<div class=\"kpi\"><div class=\"n\">'+(s.is_mobile?'mobile':'desktop')+'</div><div class=\"l\">device</div></div>');

	        const header=headerBits.join('')+'<div class=\"kpis\">'+kpis.join('')+'</div>';

	        // Breakdowns
	        const clickCounts = new Map();
	        const hoverSeconds = new Map();
	        const sectionDwell = new Map();
	        const sectionScroll = new Map(); // overlay -> max scroll pct

	        for (const e of events) {
	          const d = e && e.data ? e.data : null;
	          if (!d || typeof d !== 'object') continue;

	          if (e.type === 'click_target') {
	            const t = d.target;
	            if (typeof t === 'string' && t) clickCounts.set(t, (clickCounts.get(t) || 0) + 1);
	          }
	          if (e.type === 'hover_end') {
	            const t = d.target;
	            const sec = d.seconds;
	            if (typeof t === 'string' && t && typeof sec === 'number' && Number.isFinite(sec)) {
	              hoverSeconds.set(t, (hoverSeconds.get(t) || 0) + sec);
	            }
	          }
	          if (e.type === 'close_overlay') {
	            const o = d.overlay;
	            const dwell = d.dwell_s;
	            const sc = d.max_scroll_pct;
	            if (typeof o === 'string' && o) {
	              if (typeof dwell === 'number' && Number.isFinite(dwell)) sectionDwell.set(o, (sectionDwell.get(o) || 0) + dwell);
	              if (typeof sc === 'number' && Number.isFinite(sc)) sectionScroll.set(o, Math.max(sectionScroll.get(o) || 0, sc));
	            }
	          }
	        }

	        function topEntries(map, n) {
	          return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,n);
	        }

	        const topClicks = topEntries(clickCounts, 8);
	        const topHover = topEntries(hoverSeconds, 8);
	        const topSections = topEntries(sectionDwell, 8);

	        const breakdownHtml = [
	          '<div style=\"margin-top:12px\" class=\"split\">',
	            '<div>',
	              '<div class=\"row\" style=\"margin-bottom:8px\">Sections</div>',
	              (topSections.length ? (
	                '<table><thead><tr><th>Section</th><th>Time</th><th>Max scroll</th></tr></thead><tbody>' +
	                  topSections.map(([k,v]) => '<tr><td class=\"mono\">'+k+'</td><td>'+fmtSec(v)+'</td><td>'+(sectionScroll.has(k)?(sectionScroll.get(k)+'%'):'—')+'</td></tr>').join('') +
	                '</tbody></table>'
	              ) : '<div class=\"row\">No section data yet.</div>'),
	            '</div>',
	            '<div>',
	              '<div class=\"row\" style=\"margin-bottom:8px\">Objects</div>',
	              ((topClicks.length || topHover.length) ? (
	                '<table><thead><tr><th>Target</th><th>Clicks</th><th>Hover</th></tr></thead><tbody>' +
	                  Array.from(new Set([...topClicks.map(x=>x[0]), ...topHover.map(x=>x[0])])).slice(0,10).map((k) => {
	                    const c = clickCounts.get(k) || 0;
	                    const h = hoverSeconds.get(k) || 0;
	                    return '<tr><td class=\"mono\">'+k+'</td><td>'+(c||'—')+'</td><td>'+(h?fmtSec(h):'—')+'</td></tr>';
	                  }).join('') +
	                '</tbody></table>'
	              ) : '<div class=\"row\">No object interactions yet.</div>'),
	            '</div>',
	          '</div>'
	        ].join('');

        const timeline=events.slice(0,800).map((e)=>{
          const x=humanizeEvent(e);
          return '<div class=\"evt\"><div class=\"t\">'+(x.t||'')+'</div><div><div class=\"h\">'+x.h+'</div><div class=\"d\">'+(x.d||'')+'</div></div></div>';
        }).join('');
        const raw=events.slice(0,1200).map((e)=>{
          const t=fmtDate(e.ts);
          const data=e.data?JSON.stringify(e.data):'';
          return t+'  '+e.type+(data?('  '+data):'');
        }).join('\\n');

	        $('details').innerHTML=header+breakdownHtml+'<div style=\"margin-top:12px\">'+(state.raw?('<div class=\"pre\">'+(raw||'(none)')+'</div>'):('<div class=\"timeline\">'+(timeline||'<div class=\"row\">No events yet.</div>')+'</div>'))+'</div>';
	      }

	      function setView(view){
	        state.view=view;
	        state.search='';
	        const search=$('search');
	        if(search) {
	          search.value='';
	          search.style.display = (view==='sessions' || view==='visitors' || view==='bots') ? '' : 'none';
	        }
	        const btns=[
	          ['dashboard','btnDashboard'],
	          ['sessions','btnSessions'],
	          ['visitors','btnVisitors'],
	          ['bots','btnBots'],
	          ['map','btnMap'],
	          ['settings','btnSettings'],
	        ];
	        for(const [v,id] of btns){
	          const el=$(id);
	          if(!el) continue;
	          if(v===view) el.classList.add('active'); else el.classList.remove('active');
	        }
	        const showBotsWrap=$('showBotsWrap');
	        if(showBotsWrap) showBotsWrap.style.display = view==='sessions' ? '' : 'none';
	        const rawWrap=$('rawWrap');
	        if(rawWrap) rawWrap.style.display = (state.selectedSid && (view==='sessions' || view==='bots')) ? '' : 'none';

	        render();
	      }

	      $('btnDashboard').addEventListener('click', async ()=>{
	        setView('dashboard');
	        await loadOverview();
	      });
	      $('btnSessions').addEventListener('click', async ()=>{
	        setView('sessions');
	        await loadSessions();
	      });
	      $('btnVisitors').addEventListener('click', async ()=>{
	        setView('visitors');
	        await loadVisitors();
	      });
	      $('btnBots').addEventListener('click', async ()=>{
	        setView('bots');
	        await loadBots();
	      });
	      $('btnMap').addEventListener('click', async ()=>{
	        setView('map');
	        await loadMap();
	      });
	      $('btnSettings').addEventListener('click', ()=>{
	        setView('settings');
	      });

	      $('logout').addEventListener('click', ()=>{
	        forgetToken();
	        location.reload();
	      });

	      $('showBots').addEventListener('change', async (e)=>{
	        state.showBots=e.target.checked;
	        if(state.view==='sessions') await loadSessions();
	      });
	      $('search').addEventListener('input',(e)=>{ state.search=e.target.value||''; render(); });
	      $('refresh').addEventListener('click', async ()=>{
	        if(state.view==='dashboard') await loadOverview();
	        else if(state.view==='sessions') await loadSessions();
	        else if(state.view==='visitors') await loadVisitors();
	        else if(state.view==='bots') await loadBots();
	        else if(state.view==='map') await loadMap();
	        else render();
	      });
	      $('rawToggle').addEventListener('change', async (e)=>{ state.raw=e.target.checked; if(state.selectedSid) await loadSession(state.selectedSid); });

	      async function doContinue(){
	        const t=$('token').value||'';
	        if(!t){ showAuth('Enter a token to continue.', true); return; }
	        showAuth('Checking token…', false);
	        const ok=await checkAuth(t);
	        if(!ok){ showAuth('Invalid token.', true); return; }
	        setToken(t);
	        $('token').value='';
	        showApp();
	        setView('dashboard');
	        await loadOverview();
	      }
      $('continue').addEventListener('click', ()=>{ void doContinue(); });
      $('token').addEventListener('keydown', (e)=>{ if(e.key==='Enter') void doContinue(); });
      $('forget').addEventListener('click', ()=>{ forgetToken(); showAuth('Token forgotten.', false); });

      (async ()=>{
        const status=await loadStatus();
        if(status && status.admin_token_configured===false){ showAuth('ADMIN_TOKEN is not configured in Vercel env vars.', true); return; }
        if(status && status.db_configured===false){ showAuth('DATABASE_URL/POSTGRES_URL is not configured in Vercel env vars.', true); return; }

        const saved=getToken();
        if(!saved){ showAuth('', false); return; }
        showAuth('Checking saved token…', false);
	        const ok=await checkAuth(saved);
	        if(!ok){ forgetToken(); showAuth('Saved token was invalid. Please re-enter.', true); return; }
	        showApp();
	        setView('dashboard');
	        await loadOverview();
	      })();
    </script>
  </body>
</html>`);
}
