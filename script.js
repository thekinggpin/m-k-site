(function(){
  const root = document.documentElement;
  const distanceText = document.getElementById('distanceText');

  // Progress 0..1 based on scroll
  const clamp = (v,min,max)=>Math.max(min, Math.min(max, v));
  const lerp = (a,b,t)=>a+(b-a)*t;

  // Sections, reveal thresholds
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));

  function getScrollProgress(){
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const max = (doc.scrollHeight - window.innerHeight) || 1;
    return clamp(scrollTop / max, 0, 1);
  }

  // Distance number: 8100 -> 0
  function setDistance(p){
    const miles = Math.round(lerp(8100, 0, p));
    distanceText.textContent = miles.toLocaleString() + ' miles';
  }

  // Map pins: imperceptible closer
  const map = document.getElementById('map');
  const pinK = document.getElementById('pinK');
  const pinM = document.getElementById('pinM');
  const arcPath = document.getElementById('arcPath');

  // Positions in normalized map space (0..1)
  const start = {
    k: { x: 0.18, y: 0.34 },
    m: { x: 0.82, y: 0.66 }
  };
  // End positions (closer, but not same)
  const end = {
    k: { x: 0.44, y: 0.48 },
    m: { x: 0.56, y: 0.52 }
  };

  // Globe canvas
  const canvas = document.getElementById('globe');
  const ctx = canvas.getContext('2d');

  // basic resize for crispness
  function resizeCanvas(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);
    if(canvas.width !== w || canvas.height !== h){
      canvas.width = w;
      canvas.height = h;
    }
  }

  function drawGlobe(p, t){
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);

    // background wash
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0,0,w,h);

    const cx = w*0.5;
    const cy = h*0.5;
    const r = Math.min(w,h) * 0.33;

    // silhouette
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(43,43,43,0.06)';
    ctx.fill();

    // faint edge
    ctx.strokeStyle = 'rgba(127,155,182,0.22)';
    ctx.lineWidth = Math.max(1, r*0.01);
    ctx.stroke();

    // rotation (slow)
    const rot = (t*0.00008) + (p*0.35);

    // subtle lat/long lines
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0,0,r,0,Math.PI*2);
    ctx.clip();

    ctx.strokeStyle = 'rgba(127,155,182,0.14)';
    ctx.lineWidth = Math.max(1, r*0.004);

    const step = 10;
    for(let i=-80;i<=80;i+=step){
      const yy = (i/90)*r;
      const rr = Math.cos(i*Math.PI/180)*r;
      ctx.beginPath();
      ctx.ellipse(0, yy, rr, rr*0.22, 0, 0, Math.PI*2);
      ctx.stroke();
    }

    ctx.rotate(rot);
    for(let i=-80;i<=80;i+=step){
      const x = (i/90)*r;
      ctx.beginPath();
      ctx.ellipse(x, 0, r*0.22, r, 0, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();

    // dots and arc on globe surface
    // We'll map Connecticut and Hyderabad as approximate lon/lat
    const K = { lat: 41.6, lon: -72.7 }; // CT
    const M = { lat: 17.4, lon: 78.5 };  // Hyderabad

    function project(lat, lon){
      const phi = (lat * Math.PI/180);
      const lam = ((lon * Math.PI/180) + rot);
      // simple orthographic
      const x = r * Math.cos(phi) * Math.sin(lam);
      const y = -r * Math.sin(phi);
      const z = r * Math.cos(phi) * Math.cos(lam);
      return { x: cx + x, y: cy + y, z };
    }

    const pk = project(K.lat, K.lon);
    const pm = project(M.lat, M.lon);

    // arc between them (only when both on visible hemisphere)
    const visibleK = pk.z > 0;
    const visibleM = pm.z > 0;

    // faint arc; keep it subtle and not celebratory
    if(visibleK || visibleM){
      ctx.strokeStyle = 'rgba(183,155,92,0.22)';
      ctx.lineWidth = Math.max(1, r*0.006);
      ctx.lineCap = 'round';

      // Quadratic curve midpoint raised slightly
      const mx = (pk.x + pm.x) / 2;
      const my = (pk.y + pm.y) / 2;
      const lift = r * (0.12 + 0.05*(1-p));
      const ctrlX = mx;
      const ctrlY = my - lift;
      ctx.beginPath();
      ctx.moveTo(pk.x, pk.y);
      ctx.quadraticCurveTo(ctrlX, ctrlY, pm.x, pm.y);
      ctx.stroke();
    }

    // dots
    function dot(pt, accent){
      const a = accent ? 'rgba(127,155,182,0.85)' : 'rgba(183,155,92,0.80)';
      const b = accent ? 'rgba(127,155,182,0.20)' : 'rgba(183,155,92,0.18)';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r*0.018, 0, Math.PI*2);
      ctx.fillStyle = a;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r*0.045, 0, Math.PI*2);
      ctx.strokeStyle = b;
      ctx.lineWidth = Math.max(1, r*0.004);
      ctx.stroke();
    }
    dot(pk, true);
    dot(pm, false);

    // gentle vignette
    const grad = ctx.createRadialGradient(cx, cy, r*0.2, cx, cy, r*1.15);
    grad.addColorStop(0, 'rgba(251,250,247,0)');
    grad.addColorStop(1, 'rgba(251,250,247,0.65)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r*1.02, 0, Math.PI*2);
    ctx.fill();
  }

  // Memory fragments: appear one at a time across progress band
  const frags = [
    { el: document.getElementById('f1'), a: 0.28 },
    { el: document.getElementById('f2'), a: 0.36 },
    { el: document.getElementById('f3'), a: 0.44 },
    { el: document.getElementById('f4'), a: 0.52 },
  ];

  function setFragments(p){
    frags.forEach((f,i)=>{
      const on = p > f.a;
      f.el.style.opacity = on ? '1' : '0';
      f.el.style.transform = on ? 'translateY(0px)' : 'translateY(10px)';
    });
  }

  // Reveal elements based on viewport position (no instructions, just natural)
  function setReveals(){
    const vh = window.innerHeight;
    revealEls.forEach(el=>{
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height*0.35;
      const on = mid < vh*0.82;
      el.classList.toggle('on', on);
    });
  }

  // Map update
  function setMap(p){
    if(!map) return;
    const rect = map.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // use ease, but keep movement subtle early
    const e = p;
    const kx = lerp(start.k.x, end.k.x, e);
    const ky = lerp(start.k.y, end.k.y, e);
    const mx = lerp(start.m.x, end.m.x, e);
    const my = lerp(start.m.y, end.m.y, e);

    pinK.style.left = (kx*w - 5) + 'px';
    pinK.style.top  = (ky*h - 5) + 'px';
    pinM.style.left = (mx*w - 5) + 'px';
    pinM.style.top  = (my*h - 5) + 'px';

    // Arc path in SVG viewBox 0..100
    const x1 = kx*100, y1 = ky*100;
    const x2 = mx*100, y2 = my*100;
    const cx = (x1+x2)/2;
    const cy = (y1+y2)/2 - (8 + (1-e)*10);
    arcPath.setAttribute('d', `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`);

    // arc opacity subtly increases mid-page
    const op = clamp((p - 0.18) / 0.35, 0, 1);
    arcPath.style.opacity = (0.15 + op*0.55).toFixed(3);
  }

  // Words: tap reveals
  document.querySelectorAll('[data-word]').forEach(card=>{
    card.addEventListener('click', ()=>{
      card.classList.toggle('revealed');
    });
  });

  // Question buttons: all same response
  const reply = document.getElementById('reply');
  document.querySelectorAll('[data-opt]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      reply.classList.add('show');
    });
  });

  // Photo uploads (local only)
  const fileInput = document.getElementById('fileInput');
  const slots = Array.from(document.querySelectorAll('.ph'));
  function clearSlots(){
    slots.forEach(s=>s.innerHTML='');
  }
  function placeImages(files){
    clearSlots();
    const list = Array.from(files).slice(0, slots.length);
    list.forEach((file, i)=>{
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = ()=>{ /* revoke later for safety */ };
      img.src = url;
      slots[i].appendChild(img);
    });
  }
  if(fileInput){
    fileInput.addEventListener('change', (e)=>{
      const files = e.target.files;
      if(files && files.length){
        placeImages(files);
      }
    });
  }

  // Time zone clocks
  const ctTime = document.getElementById('ctTime');
  const hydTime = document.getElementById('hydTime');
  const ctSmall = document.getElementById('ctSmall');
  const hydSmall = document.getElementById('hydSmall');
  const sinceEl = document.getElementById('since');

  // Choose a reconnect date (implicit). You can change this.
  // Default: 2025-11-01 09:00 in America/New_York
  const reconnect = new Date('2025-11-01T09:00:00-04:00');

  function fmtTime(tz){
    return new Intl.DateTimeFormat('en-US',{
      hour:'2-digit', minute:'2-digit', second:'2-digit',
      hour12:true, timeZone: tz
    });
  }
  function fmtDay(tz){
    return new Intl.DateTimeFormat('en-US',{
      weekday:'long', month:'short', day:'2-digit',
      timeZone: tz
    });
  }

  const fmtCT = fmtTime('America/New_York');
  const fmtHYD = fmtTime('Asia/Kolkata');
  const dayCT = fmtDay('America/New_York');
  const dayHYD = fmtDay('Asia/Kolkata');

  function humanDuration(ms){
    const s = Math.floor(ms/1000);
    const minutes = Math.floor(s/60);
    const hours = Math.floor(minutes/60);
    const days = Math.floor(hours/24);
    const months = Math.floor(days/30.4375);
    const years = Math.floor(months/12);
    const remMonths = months % 12;
    const remDays = Math.floor(days - months*30.4375);

    const parts = [];
    if(years) parts.push(`${years}y`);
    if(remMonths) parts.push(`${remMonths}mo`);
    if(remDays) parts.push(`${remDays}d`);
    const remH = hours % 24;
    if(parts.length < 3) parts.push(`${remH}h`);
    return parts.join(' ');
  }

  function tickClocks(){
    const now = new Date();
    ctTime.textContent = fmtCT.format(now);
    hydTime.textContent = fmtHYD.format(now);
    ctSmall.textContent = dayCT.format(now);
    hydSmall.textContent = dayHYD.format(now);
    const delta = now - reconnect;
    sinceEl.textContent = 'time since reconnect: ' + (delta > 0 ? humanDuration(delta) : '—');
  }

  // Animation loop controlled by scroll
  let lastP = -1;
  function raf(t){
    resizeCanvas();
    const p = getScrollProgress();
    if(Math.abs(p-lastP) > 0.0001){
      root.style.setProperty('--p', p.toFixed(6));
      setDistance(p);
      setFragments(p);
      setMap(p);
      lastP = p;
    }
    setReveals();
    drawGlobe(p, t);
    requestAnimationFrame(raf);
  }

  // initial
  tickClocks();
  setInterval(tickClocks, 1000);

  window.addEventListener('resize', ()=>{
    resizeCanvas();
    setReveals();
    setMap(lastP < 0 ? getScrollProgress() : lastP);
  }, { passive:true });

  window.addEventListener('scroll', ()=>{
    // no-op; loop reads scroll
  }, { passive:true });

  requestAnimationFrame(raf);

  // Make sure map pins render once after layout
  setTimeout(()=>{
    setMap(getScrollProgress());
    setReveals();
  }, 50);

})();
