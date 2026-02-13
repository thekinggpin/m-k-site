(function(){
  const root = document.documentElement;
  const distanceText = document.getElementById('distanceText');

  // Progress 0..1 based on scroll
  const clamp = (v,min,max)=>Math.max(min, Math.min(max, v));
  const lerp = (a,b,t)=>a+(b-a)*t;

  // Sections, reveal thresholds
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));

  // Custom cursor letters M and K
  const cursorM = document.getElementById('cursor-m');
  const cursorK = document.getElementById('cursor-k');
  let mouseX = 0;
  let mouseY = 0;
  let kX = 0;
  let kY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Update M immediately at cursor
    if(cursorM) {
      cursorM.style.left = mouseX + 'px';
      cursorM.style.top = mouseY + 'px';
    }
  }, { passive: true });

  // K follows M with slow fluid easing
  function updateCursor() {
    kX += (mouseX - kX) * 0.03;
    kY += (mouseY - kY) * 0.03;
    
    if(cursorK) {
      cursorK.style.left = kX + 'px';
      cursorK.style.top = kY + 'px';
    }
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

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
    
    // Trigger pulse when distance reaches 0
    if(miles === 0){
      distanceText.classList.add('pulse');
    } else {
      distanceText.classList.remove('pulse');
    }
  }

  // Drawing puzzle: draw ">3" to complete the connection
  const drawingCanvas = document.getElementById('drawingCanvas');
  const drawingSuccess = document.getElementById('drawingSuccess');
  const drawingHint = document.getElementById('drawingHint');
  
  if(drawingCanvas){
    const ctx = drawingCanvas.getContext('2d');
    let isDrawing = false;
    let points = [];
    let hasSucceeded = false;
    
    // Properly size canvas for high DPI
    const setCanvasSize = () => {
      const rect = drawingCanvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      drawingCanvas.width = rect.width * dpr;
      drawingCanvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, rect.width, rect.height);
    };
    
    const drawDots = () => {
      const rect = drawingCanvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      
      ctx.fillStyle = 'rgba(127,155,182,0.3)';
      const dots = [
        { x: w*0.25, y: h*0.25 },
        { x: w*0.25, y: h*0.5 },
        { x: w*0.25, y: h*0.75 },
        { x: w*0.55, y: h*0.25 },
        { x: w*0.65, y: h*0.5 },
        { x: w*0.55, y: h*0.75 }
      ];
      
      dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 5, 0, Math.PI*2);
        ctx.fill();
      });
    };
    
    const checkPattern = (pts) => {
      if(pts.length < 15) return false;
      
      const rect = drawingCanvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      
      let minX = pts[0].x, maxX = pts[0].x;
      let minY = pts[0].y, maxY = pts[0].y;
      
      pts.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
      
      const hasLeftVis = pts.some(p => p.x < w*0.4);
      const hasRightVis = pts.some(p => p.x > w*0.45);
      const hasTopVis = pts.some(p => p.y < h*0.35);
      const hasBottomVis = pts.some(p => p.y > h*0.65);
      
      const score = (
        (hasLeftVis ? 25 : 0) +
        (hasRightVis ? 25 : 0) +
        (hasTopVis ? 15 : 0) +
        (hasBottomVis ? 15 : 0) +
        ((maxX - minX) > w*0.25 ? 10 : 0)
      );
      
      return score >= 60;
    };
    
    setCanvasSize();
    drawDots();
    
    drawingCanvas.addEventListener('mousedown', (e) => {
      if(hasSucceeded) return;
      isDrawing = true;
      points = [];
      
      const rect = drawingCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      points.push({x, y});
    });
    
    drawingCanvas.addEventListener('mousemove', (e) => {
      if(!isDrawing || hasSucceeded) return;
      
      const rect = drawingCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if(points.length > 0){
        const prev = points[points.length - 1];
        ctx.strokeStyle = 'rgba(127,155,182,0.7)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      
      points.push({x, y});
    });
    
    drawingCanvas.addEventListener('mouseup', () => {
      if(!isDrawing) return;
      isDrawing = false;
      
      if(checkPattern(points) && !hasSucceeded){
        hasSucceeded = true;
        drawingSuccess.style.opacity = '1';
        drawingHint.style.opacity = '0';
      }
    });
    
    drawingCanvas.addEventListener('mouseleave', () => {
      isDrawing = false;
    });
    
    window.addEventListener('resize', () => {
      setCanvasSize();
      drawDots();
    });
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

  // Memory fragments: reveal animations based on viewport
  function setFragments(p){
    // Fragment visibility now handled purely by scroll position and spacing
  }

  // Reveal elements based on viewport position
  function setReveals(){
    const vh = window.innerHeight;
    revealEls.forEach(el=>{
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height*0.35;
      const on = mid < vh*0.82;
      el.classList.toggle('on', on);
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
  const reconnect = new Date('2026-02-13T09:00:00-04:00');

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
    const totalSeconds = Math.floor(ms/1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const lastDigitMin = minutes % 10;  // Only units digit of minutes
    return `${lastDigitMin}:${seconds.toString().padStart(2, '0')}`;
  }

  // Globe canvas
  const canvas = document.getElementById('globe');
  const ctx = canvas ? canvas.getContext('2d') : null;

  function resizeCanvas(){
    if(!canvas) return;
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
    if(!canvas || !ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);

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

    const rot = (t*0.00008) + (p*0.35);

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

    const K = { lat: 41.6, lon: -72.7 };
    const M = { lat: 17.4, lon: 78.5 };

    function project(lat, lon){
      const phi = (lat * Math.PI/180);
      const lam = ((lon * Math.PI/180) + rot);
      const x = r * Math.cos(phi) * Math.sin(lam);
      const y = -r * Math.sin(phi);
      const z = r * Math.cos(phi) * Math.cos(lam);
      return { x: cx + x, y: cy + y, z };
    }

    const pk = project(K.lat, K.lon);
    const pm = project(M.lat, M.lon);

    const visibleK = pk.z > 0;
    const visibleM = pm.z > 0;

    if(visibleK || visibleM){
      ctx.strokeStyle = 'rgba(183,155,92,0.22)';
      ctx.lineWidth = Math.max(1, r*0.006);
      ctx.lineCap = 'round';
      const mx = (pk.x + pm.x) / 2;
      const my = (pk.y + pm.y) / 2;
      const lift = r * (0.12 + 0.05*(1-p));
      ctx.beginPath();
      ctx.moveTo(pk.x, pk.y);
      ctx.quadraticCurveTo(mx, my - lift, pm.x, pm.y);
      ctx.stroke();
    }

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

    const grad = ctx.createRadialGradient(cx, cy, r*0.2, cx, cy, r*1.15);
    grad.addColorStop(0, 'rgba(251,250,247,0)');
    grad.addColorStop(1, 'rgba(251,250,247,0.65)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r*1.02, 0, Math.PI*2);
    ctx.fill();
  }

  function tickClocks(){
    const now = new Date();
    ctTime.textContent = fmtCT.format(now);
    hydTime.textContent = fmtHYD.format(now);
    ctSmall.textContent = dayCT.format(now);
    hydSmall.textContent = dayHYD.format(now);
    const delta = now - reconnect;
    sinceEl.textContent = 'but still these numbers feel familiar/common? dont they?  ' + (delta > 0 ? humanDuration(delta) : '00:00');
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
  }, { passive:true });

  window.addEventListener('scroll', ()=>{
    // no-op; loop reads scroll
  }, { passive:true });

  requestAnimationFrame(raf);

  // Make sure layout renders once after load
  setTimeout(()=>{
    setReveals();
  }, 50);

})();
