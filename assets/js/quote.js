
(function(){
  const form = document.querySelector('#quoteForm');
  if(!form) return;

  const steps = [...document.querySelectorAll('.wizard-step')];
  const dots = [...document.querySelectorAll('.step-dot')];
  const mode = document.body.dataset.quoteMode || 'public';
  const phone = '447453974426';
  const canvas = document.querySelector('#structurePreview');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let current = 0;

  const roofRates = {
    'Fixed Glass': 475,
    'Sandwich Panel': 345,
    'Pergola': 380,
    'Bioclimatic Pergola': 620,
    'Lux Bioclimatic Pergola': 780,
    'Solid Polycarbonate': 390
  };
  const sideRates = {
    'Empty': 0,
    'Sliding Door': 285,
    'Bifold Door': 495,
    'Fixed Glass': 270,
    'Guillotine': 335,
    'Sandwich Panel': 165
  };
  const DISCOUNT = 0.90;
  const fmt = new Intl.NumberFormat('en-GB', { style:'currency', currency:'GBP', maximumFractionDigits:0 });

  const framePalettes = {
    'Anthracite Grey (RAL 7016)': { base:'#383E42', dark:'#1e2428', line:'rgba(255,255,255,.18)', text:'#f0c98b', glow:'rgba(218,131,17,.24)' },
    'Jet Black': { base:'#16181b', dark:'#060708', line:'rgba(255,255,255,.15)', text:'#e7eaed', glow:'rgba(255,255,255,.12)' },
    'Traffic White': { base:'#f0f0eb', dark:'#cfcfc8', line:'rgba(255,255,255,.75)', text:'#f0c98b', glow:'rgba(255,255,255,.25)' },
    'Warm Bronze': { base:'#5a4438', dark:'#32231b', line:'rgba(255,232,207,.22)', text:'#f0c98b', glow:'rgba(218,131,17,.18)' }
  };

  const summaryEls = {
    project: document.querySelector('#summaryProject'),
    dims: document.querySelector('#summaryDims'),
    colour: document.querySelector('#summaryColour'),
    roof: document.querySelector('#summaryRoof'),
    wedges: document.querySelector('#summaryWedges'),
    lights: document.querySelector('#summaryLights'),
    left: document.querySelector('#summaryLeft'),
    front: document.querySelector('#summaryFront'),
    right: document.querySelector('#summaryRight'),
    notes: document.querySelector('#summaryNotes'),
    legend: document.querySelector('#legendArea'),
    miniSpec: document.querySelector('#miniSpec')
  };

  const pitchValue = document.querySelector('#pitchValue');
  const houseBg = loadImage('../assets/images/quote-residential-reference.jpg');

  function loadImage(src){
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    img.addEventListener('load', draw);
    return img;
  }

  function updateStep(){
    steps.forEach((s,i)=>s.classList.toggle('active', i===current));
    dots.forEach((d,i)=>d.classList.toggle('active', i===current));
  }
  function showStep(i){
    current = Math.max(0, Math.min(i, steps.length - 1));
    updateStep();
  }

  document.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', (e)=>{
    e.preventDefault();
    if(validateStep(current)) showStep(current + 1);
  }));
  document.querySelectorAll('[data-prev]').forEach(btn => btn.addEventListener('click', (e)=>{
    e.preventDefault();
    showStep(current - 1);
  }));

  function validateStep(index){
    const step = steps[index];
    if(!step) return true;
    const required = [...step.querySelectorAll('[required]')];
    let ok = true;
    required.forEach(el=>{
      if(!ok) return;
      if(el.type === 'radio'){
        const checked = step.querySelector(`input[name="${el.name}"]:checked`);
        if(!checked) ok = false;
      } else if(!String(el.value || '').trim()){
        ok = false;
      }
    });
    if(!ok) window.alert('Please complete the current step first.');
    return ok;
  }

  function getData(){
    const fd = new FormData(form);
    const d = Object.fromEntries(fd.entries());
    d.length = Number(d.length || 0);
    d.width = Number(d.width || 0);
    d.height = Number(d.height || 0);
    d.pitch = 0;
    d.projectType = d.projectType || 'Residential';
    d.frameColor = d.frameColor || 'Anthracite Grey (RAL 7016)';
    d.roof = d.roof || 'Fixed Glass';
    d.wedges = d.wedges || 'Yes';
    d.lights = d.lights || 'No Lights';
    d.sideLeft = d.sideLeft || 'Empty';
    d.sideFront = d.sideFront || 'Empty';
    d.sideRight = d.sideRight || 'Empty';
    return d;
  }

  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function lerp(a,b,t){ return {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t}; }
  function drawLine(a,b,color,lw){
    ctx.beginPath();
    ctx.moveTo(a.x,a.y);
    ctx.lineTo(b.x,b.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  function drawPoly(points, fill, stroke='transparent', lw=1){
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1;i<points.length;i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    if(fill){
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if(stroke && stroke !== 'transparent'){
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }
  function clipPoly(points){
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1;i<points.length;i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.clip();
  }
  function bounds(points){
    const xs = points.map(p=>p.x);
    const ys = points.map(p=>p.y);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys)
    };
  }
  function hexToRgb(hex){
    const clean = hex.replace('#','');
    const value = clean.length === 3
      ? clean.split('').map(c=>c+c).join('')
      : clean;
    const int = parseInt(value,16);
    return {r:(int>>16)&255,g:(int>>8)&255,b:int&255};
  }
  function rgba(hex, alpha){
    const {r,g,b} = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function coverMetrics(img, x, y, w, h){
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    return {dx,dy,dw,dh,iw,ih,scale};
  }
  function coverImage(img, x, y, w, h){
    const m = coverMetrics(img, x, y, w, h);
    ctx.drawImage(img, m.dx, m.dy, m.dw, m.dh);
    return m;
  }
  function photoPoint(metrics, x, y){
    return { x: metrics.dx + x * metrics.scale, y: metrics.dy + y * metrics.scale };
  }

  function drawTag(text, x, y, kind='dark'){
    ctx.save();
    ctx.font = '700 18px Manrope, sans-serif';
    const width = Math.min(380, ctx.measureText(text).width + 30);
    const fill = kind === 'accent' ? 'rgba(218,131,17,.18)' : 'rgba(8,12,15,.58)';
    const stroke = kind === 'accent' ? 'rgba(218,131,17,.34)' : 'rgba(255,255,255,.10)';
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, 36, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#edf3f7';
    ctx.fillText(text, x + 15, y + 24);
    ctx.restore();
  }

  function glassFill(points){
    const b = bounds(points);
    const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    g.addColorStop(0, 'rgba(233,244,250,.26)');
    g.addColorStop(.32, 'rgba(185,223,241,.10)');
    g.addColorStop(.75, 'rgba(52,86,104,.18)');
    g.addColorStop(1, 'rgba(21,36,46,.26)');
    return g;
  }
  function solidFill(points){
    const b = bounds(points);
    const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    g.addColorStop(0, 'rgba(103,109,116,.96)');
    g.addColorStop(1, 'rgba(44,48,53,.98)');
    return g;
  }
  function roofFill(points, d){
    const b = bounds(points);
    const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    if(d.roof === 'Sandwich Panel'){
      g.addColorStop(0, 'rgba(110,117,124,.92)');
      g.addColorStop(1, 'rgba(56,60,64,.98)');
    } else if(d.roof === 'Solid Polycarbonate'){
      g.addColorStop(0, 'rgba(236,243,245,.42)');
      g.addColorStop(1, 'rgba(191,205,213,.28)');
    } else if(d.roof.includes('Pergola')){
      g.addColorStop(0, rgba(framePalettes[d.frameColor].base, .96));
      g.addColorStop(1, rgba(framePalettes[d.frameColor].dark, .98));
    } else {
      g.addColorStop(0, 'rgba(229,244,250,.24)');
      g.addColorStop(1, 'rgba(34,59,73,.30)');
    }
    return g;
  }

  function drawGlassHighlights(points){
    const b = bounds(points);
    ctx.save();
    clipPoly(points);
    const s1 = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
    s1.addColorStop(0, 'rgba(255,255,255,.28)');
    s1.addColorStop(.35, 'rgba(255,255,255,.07)');
    s1.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = s1;
    ctx.fillRect(b.x - 8, b.y - 8, b.w * .45, b.h + 16);

    const s2 = ctx.createLinearGradient(b.x + b.w * .45, b.y, b.x + b.w, b.y + b.h);
    s2.addColorStop(0, 'rgba(170,210,228,.16)');
    s2.addColorStop(.5, 'rgba(255,255,255,.05)');
    s2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = s2;
    ctx.fillRect(b.x + b.w * .42, b.y - 8, b.w * .34, b.h + 16);

    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(b.x + b.w * .18, b.y + 10);
    ctx.lineTo(b.x + b.w * .28, b.y + b.h - 10);
    ctx.moveTo(b.x + b.w * .58, b.y + 8);
    ctx.lineTo(b.x + b.w * .68, b.y + b.h - 10);
    ctx.stroke();
    ctx.restore();
  }

  function drawSideSystem(points, type, frame, orientation){
    if(type === 'Empty') return;
    const fill = type === 'Sandwich Panel' ? solidFill(points) : glassFill(points);
    drawPoly(points, fill, 'rgba(255,255,255,.06)', 1);
    if(type !== 'Sandwich Panel') drawGlassHighlights(points);

    const p1=points[0], p2=points[1], p3=points[2], p4=points[3];
    const edge = rgba(frame.dark, .94);
    drawLine(p1,p2,edge,4.5);
    drawLine(p2,p3,edge,4.5);
    drawLine(p3,p4,edge,4.8);
    drawLine(p4,p1,edge,4.8);

    const vertical = (t, w, c) => drawLine(lerp(p1,p2,t), lerp(p4,p3,t), c, w);
    const horizontal = (t, w, c) => drawLine(lerp(p1,p4,t), lerp(p2,p3,t), c, w);

    if(type === 'Sliding Door'){
      [0.24,0.5,0.76].forEach(t => vertical(t, 2.2, rgba(frame.base, .88)));
      vertical(orientation === 'front' ? 0.5 : 0.74, 4.8, rgba(frame.dark, .95));
      [0.26,0.51].forEach(t=>{
        const top = lerp(p1,p2,t);
        const bot = lerp(p4,p3,t);
        ctx.fillStyle = 'rgba(244,248,250,.55)';
        ctx.fillRect(top.x - 1.5, (top.y + bot.y) / 2 - 14, 3, 28);
      });
    } else if(type === 'Fixed Glass'){
      vertical(0.5, 1.2, 'rgba(235,242,246,.24)');
    } else if(type === 'Bifold Door'){
      [0.2,0.4,0.6,0.8].forEach(t=>vertical(t, 2, rgba(frame.base, .88)));
      [0.2,0.4,0.6,0.8].forEach(t=>{
        const c = lerp(lerp(p1,p2,t), lerp(p4,p3,t), .52);
        ctx.fillStyle = 'rgba(244,248,250,.58)';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if(type === 'Guillotine'){
      [0.34,0.68].forEach(t=>horizontal(t, 2.8, rgba(frame.base, .92)));
      const c = lerp(lerp(p1,p2,.5), lerp(p4,p3,.5), .56);
      ctx.fillStyle = 'rgba(245,248,250,.56)';
      ctx.fillRect(c.x - 14, c.y - 1.5, 28, 3);
    } else if(type === 'Sandwich Panel'){
      for(let t=.1;t<1;t+=.12){
        horizontal(t, 1, 'rgba(255,255,255,.08)');
      }
    }
  }

  function drawWedges(points, frame){
    const fill = ctx.createLinearGradient(points[0].x, points[0].y, points[2].x, points[2].y);
    fill.addColorStop(0, 'rgba(226,241,249,.22)');
    fill.addColorStop(1, 'rgba(26,44,55,.18)');
    drawPoly(points, fill, 'rgba(255,255,255,.12)', 1);
    drawGlassHighlights(points);
    drawLine(points[0], points[1], rgba(frame.dark, .94), 4.2);
    drawLine(points[1], points[2], rgba(frame.dark, .94), 4.2);
    drawLine(points[2], points[0], rgba(frame.dark, .94), 4.2);
  }

  function drawRoof(points, d, frame){
    drawPoly(points, roofFill(points, d), 'rgba(255,255,255,.08)', 1.1);
    if(d.roof.includes('Pergola')){
      const isLux = d.roof === 'Lux Bioclimatic Pergola';
      for(let t=.06;t<1;t+=.075){
        drawLine(lerp(points[0],points[1],t), lerp(points[3],points[2],t), isLux ? 'rgba(255,220,170,.44)' : rgba(frame.base, .95), isLux ? 3.2 : 2.7);
      }
    } else if(d.roof === 'Sandwich Panel'){
      for(let t=.08;t<1;t+=.08){
        drawLine(lerp(points[0],points[1],t), lerp(points[3],points[2],t), 'rgba(255,255,255,.08)', 1.1);
      }
    } else {
      drawGlassHighlights(points);
    }
    [[points[0],points[1]],[points[1],points[2]],[points[2],points[3]],[points[3],points[0]]].forEach(([a,b])=>{
      drawLine(a,b, rgba(frame.dark, .96), 5.6);
      drawLine(a,b, frame.line, 1.2);
    });
  }

  function drawLighting(frontTopLeft, frontTopRight, rightTopRight, d){
    if(d.lights === 'No Lights') return;
    const glowColor = d.lights === 'Perimeter LED Package' ? 'rgba(255,208,134,.85)' : 'rgba(255,228,178,.72)';
    const wideGlow = d.lights === 'Perimeter LED Package' ? 26 : 18;
    [ [frontTopLeft, frontTopRight], [frontTopRight, rightTopRight] ].forEach(([a,b])=>{
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, 'rgba(255,205,132,0)');
      grad.addColorStop(.5, glowColor);
      grad.addColorStop(1, 'rgba(255,205,132,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = wideGlow;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + 6);
      ctx.lineTo(b.x, b.y + 6);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,228,190,.78)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + 2);
      ctx.lineTo(b.x, b.y + 2);
      ctx.stroke();
    });
  }

  function drawFloorReflection(zone){
    const g = ctx.createLinearGradient(zone.x, zone.y, zone.x, zone.y + zone.h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,.09)');
    ctx.fillStyle = g;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  }

  function drawResidential(d){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let metrics;
    if(houseBg.complete && (houseBg.naturalWidth || houseBg.width)){
      metrics = coverImage(houseBg, 0, 0, canvas.width, canvas.height);
    } else {
      const sky = ctx.createLinearGradient(0,0,0,canvas.height);
      sky.addColorStop(0, '#97a9ba');
      sky.addColorStop(.45, '#47535c');
      sky.addColorStop(1, '#1c2329');
      ctx.fillStyle = sky;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      metrics = {dx:0,dy:0,dw:canvas.width,dh:canvas.height,iw:768,ih:1024,scale:canvas.width/768};
    }

    const overlay = ctx.createLinearGradient(0,0,0,canvas.height);
    overlay.addColorStop(0, 'rgba(10,14,18,.06)');
    overlay.addColorStop(.64, 'rgba(11,15,18,.08)');
    overlay.addColorStop(1, 'rgba(6,9,12,.12)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const frame = framePalettes[d.frameColor] || framePalettes['Anthracite Grey (RAL 7016)'];
    const front = [
      photoPoint(metrics, 84, 296),
      photoPoint(metrics, 322, 353),
      photoPoint(metrics, 334, 730),
      photoPoint(metrics, 93, 720)
    ];
    const right = [
      photoPoint(metrics, 338, 289),
      photoPoint(metrics, 680, 285),
      photoPoint(metrics, 681, 719),
      photoPoint(metrics, 338, 730)
    ];
    const leftReturn = [
      photoPoint(metrics, 41, 298),
      photoPoint(metrics, 82, 296),
      photoPoint(metrics, 92, 718),
      photoPoint(metrics, 52, 696)
    ];
    const roof = [
      photoPoint(metrics, 114, 159),
      photoPoint(metrics, 339, 182),
      photoPoint(metrics, 680, 188),
      photoPoint(metrics, 318, 352)
    ];
    const frontWedge = [
      photoPoint(metrics, 86, 297),
      photoPoint(metrics, 321, 353),
      photoPoint(metrics, 321, 291)
    ];
    const rightWedge = [
      photoPoint(metrics, 338, 289),
      photoPoint(metrics, 513, 291),
      photoPoint(metrics, 338, 352)
    ];
    const floorZone = bounds([front[3], right[3], right[2], front[2]]);

    drawRoof(roof, d, frame);
    drawSideSystem(front, d.sideFront, frame, 'front');
    drawSideSystem(right, d.sideRight, frame, 'right');
    if(d.sideLeft !== 'Empty'){
      drawSideSystem(leftReturn, d.sideLeft === 'Sandwich Panel' ? 'Sandwich Panel' : 'Fixed Glass', frame, 'left');
    }

    if(d.wedges === 'Yes'){
      drawWedges(frontWedge, frame);
      drawWedges(rightWedge, frame);
    }

    const frameEdges = [
      [front[0], front[1]],[front[1], front[2]],[front[2], front[3]],[front[3], front[0]],
      [right[0], right[1]],[right[1], right[2]],[right[2], right[3]],[right[3], right[0]],
      [roof[0], roof[1]],[roof[1], roof[2]],[roof[2], roof[3]],[roof[3], roof[0]],
      [front[1], right[0]],[front[2], right[3]]
    ];
    frameEdges.forEach(([a,b], index)=>{
      drawLine(a,b, rgba(frame.base, .95), index < 8 ? 7 : 6);
      drawLine(a,b, frame.line, 1.1);
    });

    drawLighting(front[0], front[1], right[1], d);
    drawFloorReflection({x:floorZone.x, y:floorZone.y - 4, w:floorZone.w, h:floorZone.h + 12});

    const sh = ctx.createLinearGradient(0, floorZone.y + 8, 0, floorZone.y + floorZone.h + 32);
    sh.addColorStop(0, 'rgba(0,0,0,.04)');
    sh.addColorStop(1, 'rgba(0,0,0,.20)');
    ctx.fillStyle = sh;
    ctx.fillRect(floorZone.x - 8, floorZone.y + 10, floorZone.w + 16, floorZone.h + 36);

    drawTag(d.roof, canvas.width - 330, canvas.height - 126, 'dark');
    drawTag(d.frameColor, canvas.width - 330, canvas.height - 84, 'accent');
  }

  function businessPoint(x, y){
    return {x: canvas.width * x, y: canvas.height * y};
  }

  function drawTileFloor(topY){
    const floor = ctx.createLinearGradient(0, topY, 0, canvas.height);
    floor.addColorStop(0, '#3b454d');
    floor.addColorStop(.4, '#1c2328');
    floor.addColorStop(1, '#11161a');
    ctx.fillStyle = floor;
    ctx.beginPath();
    ctx.moveTo(0, topY);
    ctx.lineTo(canvas.width, topY);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    for(let i=0;i<14;i++){
      const t = i/13;
      const y = topY + Math.pow(t, 1.75) * (canvas.height - topY - 12);
      ctx.beginPath();
      ctx.moveTo(60 + t * 30, y);
      ctx.lineTo(canvas.width - 60 - t * 30, y);
      ctx.stroke();
    }
    for(let i=0;i<16;i++){
      const x = 80 + i * 90;
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(canvas.width/2 + (x - canvas.width/2) * .48, canvas.height);
      ctx.stroke();
    }
  }

  function drawBusiness(d){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const sky = ctx.createLinearGradient(0,0,0,canvas.height);
    sky.addColorStop(0, '#8ca1b2');
    sky.addColorStop(.38, '#45515a');
    sky.addColorStop(1, '#1a2025');
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = 'rgba(14,18,22,.55)';
    ctx.fillRect(0, canvas.height * .15, canvas.width, canvas.height * .34);
    ctx.fillStyle = 'rgba(255,255,255,.04)';
    for(let i=0;i<6;i++){
      ctx.fillRect(50 + i * 255, canvas.height * .18, 180, canvas.height * .22);
    }

    ctx.fillStyle = 'rgba(9,12,15,.76)';
    ctx.fillRect(canvas.width * .08, canvas.height * .08, canvas.width * .3, canvas.height * .08);
    ctx.fillStyle = '#f0c98b';
    ctx.font = '700 36px Manrope, sans-serif';
    const title = d.projectType === 'Business' ? 'Business outdoor concept' : 'Winter garden concept';
    ctx.fillText(title, canvas.width * .1, canvas.height * .135);

    drawTileFloor(canvas.height * .54);

    const frame = framePalettes[d.frameColor] || framePalettes['Anthracite Grey (RAL 7016)'];
    const front = [businessPoint(.24,.48), businessPoint(.53,.56), businessPoint(.53,.87), businessPoint(.18,.80)];
    const right = [businessPoint(.53,.56), businessPoint(.83,.48), businessPoint(.85,.80), businessPoint(.53,.87)];
    const left = [businessPoint(.18,.80), businessPoint(.24,.48), businessPoint(.32,.40), businessPoint(.25,.73)];
    const roof = [businessPoint(.24,.34), businessPoint(.53,.40), businessPoint(.83,.34), businessPoint(.53,.56)];
    const frontWedge = [businessPoint(.24,.48), businessPoint(.53,.56), businessPoint(.53,.47)];
    const rightWedge = [businessPoint(.53,.56), businessPoint(.67,.41), businessPoint(.53,.47)];

    drawRoof(roof, d, frame);
    drawSideSystem(front, d.sideFront, frame, 'front');
    drawSideSystem(right, d.sideRight, frame, 'right');
    if(d.sideLeft !== 'Empty'){
      drawSideSystem(left, d.sideLeft, frame, 'left');
    }
    if(d.wedges === 'Yes'){
      drawWedges(frontWedge, frame);
      drawWedges(rightWedge, frame);
    }

    const edges = [
      [front[0], front[1]],[front[1], front[2]],[front[2], front[3]],[front[3], front[0]],
      [right[0], right[1]],[right[1], right[2]],[right[2], right[3]],[right[3], right[0]],
      [left[0], left[1]],[left[1], left[2]],[left[2], left[3]],[left[3], left[0]],
      [roof[0], roof[1]],[roof[1], roof[2]],[roof[2], roof[3]],[roof[3], roof[0]]
    ];
    edges.forEach(([a,b], idx)=>{
      drawLine(a,b, rgba(frame.base, .96), idx < 12 ? 7 : 6);
      drawLine(a,b, frame.line, 1.2);
    });
    drawLighting(front[0], front[1], right[1], d);

    const base = bounds([front[3], right[2], right[3]]);
    const shadow = ctx.createRadialGradient(canvas.width * .56, canvas.height * .84, 40, canvas.width * .56, canvas.height * .84, 340);
    shadow.addColorStop(0, 'rgba(0,0,0,.34)');
    shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(base.x - 100, base.y - 30, base.w + 200, base.h + 120);

    drawTag(d.roof, canvas.width - 330, canvas.height - 126, 'dark');
    drawTag(d.frameColor, canvas.width - 330, canvas.height - 84, 'accent');
  }

  function drawInsetPlan(d){
    const box = {x: canvas.width - 290, y: 28, w: 246, h: 188};
    ctx.save();
    ctx.fillStyle = 'rgba(8,12,15,.56)';
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f0c98b';
    ctx.font = '700 18px Manrope, sans-serif';
    ctx.fillText('Configuration', box.x + 18, box.y + 28);

    const px = box.x + 56, py = box.y + 58, w = 138, h = 88;
    ctx.fillStyle = 'rgba(255,255,255,.03)';
    ctx.fillRect(px + 18, py + 18, w - 36, h - 36);

    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, w, h);

    const highlight = 'rgba(218,131,17,.85)';
    ctx.strokeStyle = highlight;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px + 2, py + h/2);
    ctx.lineTo(px + 2, py + 2);
    ctx.lineTo(px + w - 2, py + 2);
    ctx.lineTo(px + w - 2, py + h/2);
    ctx.stroke();

    ctx.fillStyle = '#edf3f7';
    ctx.font = '700 13px Manrope, sans-serif';
    ctx.fillText('LEFT', px - 42, py + h/2 + 4);
    ctx.fillText('FRONT', px + w/2 - 20, py + h + 26);
    ctx.fillText('RIGHT', px + w + 14, py + h/2 + 4);

    ctx.fillStyle = '#dce5eb';
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.fillText(d.sideLeft, px - 40, py + h/2 + 22);
    ctx.fillText(d.sideFront, px + 10, py + h + 44);
    ctx.fillText(d.sideRight, px + w + 14, py + h/2 + 22);

    ctx.fillStyle = 'rgba(255,255,255,.78)';
    ctx.font = '700 12px Manrope, sans-serif';
    ctx.fillText('Roof', box.x + 18, box.y + 164);
    ctx.fillText(d.roof, box.x + 58, box.y + 164);
    ctx.restore();
  }

  function drawInfoHud(d){
    const topBar = ctx.createLinearGradient(0,0,canvas.width,0);
    topBar.addColorStop(0, 'rgba(8,11,14,.52)');
    topBar.addColorStop(1, 'rgba(8,11,14,.18)');
    ctx.fillStyle = topBar;
    ctx.fillRect(0,0,canvas.width,78);

    ctx.fillStyle = '#f4f7f9';
    ctx.font = '700 24px Manrope, sans-serif';
    ctx.fillText(`${d.projectType} • ${d.length || '-'}m × ${d.width || '-'}m × ${d.height || '-'}m`, 34, 42);

    ctx.fillStyle = 'rgba(237,243,247,.86)';
    ctx.font = '600 14px Manrope, sans-serif';
    ctx.fillText(`Colour: ${d.frameColor}   •   Wedges: ${d.wedges}   •   Lights: ${d.lights}`, 34, 66);
  }

  function updateSummary(d){
    if(pitchValue) pitchValue.textContent = `${d.pitch}°`;
    if(summaryEls.project) summaryEls.project.textContent = d.projectType;
    if(summaryEls.dims) summaryEls.dims.textContent = `${d.length || '-'}m × ${d.width || '-'}m × ${d.height || '-'}m`;
    if(summaryEls.colour) summaryEls.colour.textContent = d.frameColor;
    if(summaryEls.roof) summaryEls.roof.textContent = `${d.roof}`;
    if(summaryEls.wedges) summaryEls.wedges.textContent = d.wedges;
    if(summaryEls.lights) summaryEls.lights.textContent = d.lights;
    if(summaryEls.left) summaryEls.left.textContent = d.sideLeft;
    if(summaryEls.front) summaryEls.front.textContent = d.sideFront;
    if(summaryEls.right) summaryEls.right.textContent = d.sideRight;
    if(summaryEls.notes) summaryEls.notes.textContent = d.notes ? d.notes : 'No additional notes yet.';
    if(summaryEls.legend){
      summaryEls.legend.innerHTML = `
        <span class="legend-chip">Roof: ${d.roof}</span>
        <span class="legend-chip">Colour: ${d.frameColor}</span>
        <span class="legend-chip">Wedges: ${d.wedges}</span>
        <span class="legend-chip">Lights: ${d.lights}</span>
      `;
    }
    if(summaryEls.miniSpec){
      summaryEls.miniSpec.textContent = `${d.projectType} • ${d.frameColor}`;
    }
    const previewBox = document.querySelector('#messagePreview');
    const previewWa = document.querySelector('#whatsAppLink');
    if(mode === 'admin' && previewBox){
      const estimate = calcEstimate(d);
      const total = estimate.roofCost + estimate.leftCost + estimate.frontCost + estimate.rightCost;
      const sideDescription = [d.sideLeft, d.sideFront, d.sideRight].every(v => v === 'Sliding Door')
        ? 'Full sliding doors (left, front, right)'
        : `Left: ${d.sideLeft}, Front: ${d.sideFront}, Right: ${d.sideRight}`;
      const msg = [
        'Hello! Thank you for sharing your winter garden details.',
        '',
        `Based on your measurements (${d.length}m × ${d.width}m × ${d.height}m) and preferences, here is your quotation:`,
        '',
        `Total Price: ${fmt.format(Math.round(total))} (including installation, delivery, and VAT)`,
        '',
        'Specification:',
        `• Roof: ${d.roof}`,
        `• Sides: ${sideDescription}`,
        '• Side Glass: 22mm double glazed',
        d.roof === 'Fixed Glass' ? '• Roof Glass: 4+4 = 8mm tempered glass' : `• Roof Finish: ${d.roof}`,
        '• Frame: High-quality aluminium system',
        '',
        'We also provide a 10-year warranty (covering all non-user-related issues).',
        '',
        'Everything is fully custom-made to your space and built with top-quality materials.',
        '',
        'Note:',
        '',
        'If you’re happy with the price, the next step would be to arrange a site survey for precise measurements.',
        '',
        'Let me know what you think.'
      ].join('\n');
      previewBox.value = msg;
      if(previewWa) previewWa.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    }
  }

  function draw(){
    const d = getData();
    updateSummary(d);
    if(!ctx) return;
    if(d.projectType === 'Business') drawBusiness(d);
    else drawResidential(d);
    drawInfoHud(d);
    drawInsetPlan(d);
  }

  function calcEstimate(d){
    const roofArea = d.length * d.width;
    const leftArea = d.width * d.height;
    const frontArea = d.length * d.height;
    const rightArea = d.width * d.height;
    return {
      roofCost: roofArea * (roofRates[d.roof] || 0) * DISCOUNT,
      leftCost: leftArea * (sideRates[d.sideLeft] || 0) * DISCOUNT,
      frontCost: frontArea * (sideRates[d.sideFront] || 0) * DISCOUNT,
      rightCost: rightArea * (sideRates[d.sideRight] || 0) * DISCOUNT
    };
  }

  form.addEventListener('input', draw);
  draw();
  updateStep();

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(!validateStep(current)) return;
    const d = getData();
    const resultBox = document.querySelector('#quoteResult');
    const wa = document.querySelector('#whatsAppLink');

    let msg;
    if(mode === 'admin'){
      const estimate = calcEstimate(d);
      const total = estimate.roofCost + estimate.leftCost + estimate.frontCost + estimate.rightCost;
      const sideDescription = [d.sideLeft, d.sideFront, d.sideRight].every(v => v === 'Sliding Door')
        ? 'Full sliding doors (left, front, right)'
        : `Left: ${d.sideLeft}, Front: ${d.sideFront}, Right: ${d.sideRight}`;
      msg = [
        'Hello! Thank you for sharing your winter garden details.',
        '',
        `Based on your measurements (${d.length}m × ${d.width}m × ${d.height}m) and preferences, here is your quotation:`,
        '',
        `Total Price: ${fmt.format(Math.round(total))} (including installation, delivery, and VAT)`,
        '',
        'Specification:',
        `• Roof: ${d.roof}`,
        `• Sides: ${sideDescription}`,
        '• Side Glass: 22mm double glazed',
        d.roof === 'Fixed Glass' ? '• Roof Glass: 4+4 = 8mm tempered glass' : `• Roof Finish: ${d.roof}`,
        '• Frame: High-quality aluminium system',
        '',
        'We also provide a 10-year warranty (covering all non-user-related issues).',
        '',
        'Everything is fully custom-made to your space and built with top-quality materials.',
        '',
        'Note:',
        '',
        'If you’re happy with the price, the next step would be to arrange a site survey for precise measurements.',
        '',
        'Let me know what you think.'
      ].join('\n');
      if(wa) wa.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      const priceBox = document.querySelector('#priceBox');
      const breakdown = document.querySelector('#priceBreakdown');
      if(breakdown){
        breakdown.innerHTML = `
          <div class="price-row"><span>Roof — ${d.roof}</span><strong>${fmt.format(estimate.roofCost)}</strong></div>
          <div class="price-row"><span>Left side — ${d.sideLeft}</span><strong>${fmt.format(estimate.leftCost)}</strong></div>
          <div class="price-row"><span>Front side — ${d.sideFront}</span><strong>${fmt.format(estimate.frontCost)}</strong></div>
          <div class="price-row"><span>Right side — ${d.sideRight}</span><strong>${fmt.format(estimate.rightCost)}</strong></div>
          <div class="total-row"><span>Total estimate</span><span>${fmt.format(total)} (±10%)</span></div>
        `;
      }
      if(priceBox) priceBox.classList.add('active');
      const previewBox = document.querySelector('#messagePreview');
      if(previewBox) previewBox.value = msg;
    } else {
      msg = [
        'Hello Hawk Outdoor, I would like a quotation.',
        '',
        `Project type: ${d.projectType}`,
        `Dimensions: ${d.length}m x ${d.width}m x ${d.height}m`,
        `Frame colour: ${d.frameColor}`,
        `Roof: ${d.roof}`,
        `Wedges: ${d.wedges}`,
        `Lights: ${d.lights}`,
        `Left side: ${d.sideLeft}`,
        `Front side: ${d.sideFront}`,
        `Right side: ${d.sideRight}`,
        d.location ? `Area/Postcode: ${d.location}` : '',
        d.name ? `Name: ${d.name}` : '',
        d.email ? `Email: ${d.email}` : '',
        d.notes ? `Notes: ${d.notes}` : ''
      ].filter(Boolean).join('\n');
      if(wa) wa.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      if(resultBox) resultBox.classList.add('active');
    }
  });
})();