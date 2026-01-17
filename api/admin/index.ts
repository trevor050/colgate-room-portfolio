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
            <h1>Portfolio Analytics</h1>
            <div class="row">Sessions + events (raw view optional)</div>
          </div>
          <div class="pill"><span style="color:var(--gold)">●</span> admin</div>
        </header>

        <div class="grid">
          <div class="card">
            <div class="hd">
              <div class="controls">
                <button class="btn active" id="btnSessions">Sessions</button>
                <button class="btn" id="btnVisitors">Visitors</button>
                <label class="tag"><input id="showBots" type="checkbox" /> show bots</label>
                <input class="input" id="search" placeholder="Search (org, ptr, city, ip, vid)" />
                <button class="btn" id="refresh">Refresh</button>
              </div>
            </div>
            <div class="bd" id="list">Loading…</div>
          </div>

          <div class="card">
            <div class="hd">
              <div class="controls" style="width:100%">
                <div class="row" style="flex:1">Details</div>
                <label class="tag"><input id="rawToggle" type="checkbox" /> raw</label>
              </div>
            </div>
            <div class="bd" id="details">Select a session to view details.</div>
          </div>
        </div>
      </div>
    </div>

    <script>
      const $ = (id) => document.getElementById(id);
      const state = { authed:false, view:'sessions', sessions:[], visitors:[], showBots:false, search:'', raw:false, selectedSid:null };

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
                '<td>'+fmtDate(s.started_at)+'<div class=\"mono\">'+(s.vid_short||'')+'</div></td>'+
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
          '<th>Visitor</th><th>Last seen</th><th>Identity</th><th>Last IP</th>',
          '</tr></thead>',
          '<tbody>',
          ...rows.map((v)=>{
            const loc=[v.city,v.region,v.country].filter(Boolean).join(', ');
            const who=v.org || v.ptr || (loc?loc:'');
            return (
              '<tr>'+
                '<td class=\"mono\">'+v.vid+'</td>'+
                '<td>'+fmtDate(v.last_seen_at)+'</td>'+
                '<td>'+(who?('<div class=\"mono\">'+who+'</div>'):'<span class=\"mono\">(unknown)</span>')+'</td>'+
                '<td class=\"mono\">'+(v.last_ip||'')+'</td>'+
              '</tr>'
            );
          }),
          '</tbody></table>'
        ].join('');
        $('list').innerHTML=html;
      }

      function render(){ state.view==='sessions' ? renderSessions() : renderVisitors(); }

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
        const data=await api('/api/admin/session?sid='+encodeURIComponent(sid));
        const s=data.session;
        const events=data.events||[];

        const headerBits=[];
        headerBits.push('<div class=\"row\" style=\"margin-bottom:10px\">'+
          '<span class=\"tag '+(s.is_bot?'bad':'good')+'\">'+(s.is_bot?'bot':'human?')+'</span>'+
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

      $('btnSessions').addEventListener('click', async ()=>{
        state.view='sessions';
        $('btnSessions').classList.add('active');
        $('btnVisitors').classList.remove('active');
        await loadSessions();
      });
      $('btnVisitors').addEventListener('click', async ()=>{
        state.view='visitors';
        $('btnVisitors').classList.add('active');
        $('btnSessions').classList.remove('active');
        await loadVisitors();
      });
      $('showBots').addEventListener('change', async (e)=>{
        state.showBots=e.target.checked;
        if(state.view==='sessions') await loadSessions();
      });
      $('search').addEventListener('input',(e)=>{ state.search=e.target.value||''; render(); });
      $('refresh').addEventListener('click', async ()=>{ state.view==='sessions'?await loadSessions():await loadVisitors(); });
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
        await loadSessions();
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
        await loadSessions();
      })();
    </script>
  </body>
</html>`);
}
