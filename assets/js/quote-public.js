(function(){
  const form = document.querySelector('#quoteForm');
  if(!form) return;

  const steps = [...document.querySelectorAll('.wizard-step')];
  const dots = [...document.querySelectorAll('.step-dot')];
  const mode = document.body.dataset.quoteMode || 'public';
  const phone = '447453974426';
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
  const faceColors = {
    'Sliding Door':'rgba(170, 212, 231, 0.26)',
    'Bifold Door':'rgba(183, 219, 235, 0.24)',
    'Fixed Glass':'rgba(138, 211, 237, 0.24)',
    'Guillotine':'rgba(184, 208, 227, 0.22)',
    'Sandwich Panel':'rgba(120, 129, 138, 0.96)',
    'Empty':'rgba(0,0,0,0.01)'
  };
  const roofColors = {
    'Fixed Glass':'rgba(152, 224, 245, 0.24)',
    'Sandwich Panel':'rgba(171, 177, 183, 1)',
    'Pergola':'rgba(125, 132, 140, 1)',
    'Bioclimatic Pergola':'rgba(208, 212, 217, 1)',
    'Lux Bioclimatic Pergola':'rgba(222, 224, 227, 1)',
    'Solid Polycarbonate':'rgba(216, 233, 243, 0.62)'
  };

  function updateStep(){
    steps.forEach((s,i)=> s.classList.toggle('active', i===current));
    dots.forEach((d,i)=> d.classList.toggle('active', i===current));
  }
  function showStep(i){
    current = Math.max(0, Math.min(i, steps.length-1));
    updateStep();
  }
  document.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', (e)=>{
    e.preventDefault();
    if(validateStep(current)) showStep(current+1);
  }));
  document.querySelectorAll('[data-prev]').forEach(btn => btn.addEventListener('click', (e)=>{
    e.preventDefault();
    showStep(current-1);
  }));

  function validateStep(index){
    const step = steps[index];
    if(!step) return true;
    const req = [...step.querySelectorAll('[required]')];
    let ok = true;
    for(const el of req){
      if(el.type === 'radio') continue;
      if(!el.value){ ok = false; el.reportValidity?.(); break; }
    }
    const radioGroups = [...new Set(req.filter(el=>el.type==='radio').map(el=>el.name))];
    for(const name of radioGroups){
      if(!form.querySelector(`input[name="${name}"]:checked`)){ ok = false; break; }
    }
    if(!ok) window.alert('Please complete the current step first.');
    return ok;
  }

  function getData(){
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.length = Number(data.length || 0);
    data.width = Number(data.width || 0);
    data.height = Number(data.height || 0);
    data.pitch = 0;
    data.projectType = data.projectType || 'Residential';
    data.roof = data.roof || 'Fixed Glass';
    data.sideLeft = data.sideLeft || 'Empty';
    data.sideFront = data.sideFront || 'Empty';
    data.sideRight = data.sideRight || 'Empty';
    return data;
  }

  const summaryEls = {
    project: document.querySelector('#summaryProject'),
    dims: document.querySelector('#summaryDims'),
    roof: document.querySelector('#summaryRoof'),
    left: document.querySelector('#summaryLeft'),
    front: document.querySelector('#summaryFront'),
    right: document.querySelector('#summaryRight'),
    notes: document.querySelector('#summaryNotes'),
    legend: document.querySelector('#legendArea')
  };

  const canvas = document.querySelector('#structurePreview');
  const ctx = canvas?.getContext('2d');
  const bgImages = {
    house: loadImage('../assets/images/quote-residential-reference.jpg'),
    business: loadImage('https://images.pexels.com/photos/18823964/pexels-photo-18823964.jpeg?cs=srgb&dl=pexels-boris-ivas-28180462-18823964.jpg&fm=jpg')
  };

  function loadImage(src){
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    img.addEventListener('load', draw);
    return img;
  }
  function lerp(a,b,t){ return {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t}; }
  function coverImage(img, x, y, w, h){
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if(!iw || !ih) return;
    const scale = Math.max(w/iw, h/ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  function drawPoly(points, fill, stroke='rgba(255,255,255,.24)', lw=1.5){
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1;i<points.length;i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    if(fill){ ctx.fillStyle = fill; ctx.fill(); }
    if(stroke && lw){ ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function clipPoly(points){
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1;i<points.length;i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.clip();
  }
  function drawLine(a,b,color='rgba(255,255,255,.55)',lw=1.6){
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.stroke();
  }
  function softVignette(){
    const v = ctx.createRadialGradient(canvas.width*0.5, canvas.height*0.32, 100, canvas.width*0.5, canvas.height*0.46, canvas.width*0.72);
    v.addColorStop(0,'rgba(0,0,0,0)');
    v.addColorStop(1,'rgba(0,0,0,.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  function fillPhotoBackdrop(type){
    ctx.fillStyle = '#12171a';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    const img = type === 'Business' ? bgImages.business : bgImages.house;
    if(img && img.complete && (img.naturalWidth || img.width)){
      coverImage(img, 0, 0, canvas.width, canvas.height);
      const fade = ctx.createLinearGradient(0,0,0,canvas.height);
      if(type === 'Business'){
        fade.addColorStop(0,'rgba(12,18,22,.18)');
        fade.addColorStop(.58,'rgba(15,20,24,.34)');
        fade.addColorStop(1,'rgba(8,12,15,.62)');
      } else {
        fade.addColorStop(0,'rgba(10,14,18,.08)');
        fade.addColorStop(.60,'rgba(11,15,18,.14)');
        fade.addColorStop(1,'rgba(7,10,13,.18)');
      }
      ctx.fillStyle = fade;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,.05)';
      ctx.fillRect(0,0,canvas.width,canvas.width*0.012);
    } else {
      const sky = ctx.createLinearGradient(0,0,0,canvas.height);
      sky.addColorStop(0,'#5f7482');
      sky.addColorStop(.45,'#27343e');
      sky.addColorStop(1,'#141a1f');
      ctx.fillStyle = sky;
      ctx.fillRect(0,0,canvas.width,canvas.height);
    }
    softVignette();
  }
  function scalePhotoPoint(x,y){
    return {x: canvas.width * (x/1200), y: canvas.height * (y/760)};
  }
  function pointSeries(list){ return list.map(([x,y]) => scalePhotoPoint(x,y)); }
  function boundsOf(points){
    const xs = points.map(p=>p.x), ys = points.map(p=>p.y);
    return {x:Math.min(...xs), y:Math.min(...ys), w:Math.max(...xs)-Math.min(...xs), h:Math.max(...ys)-Math.min(...ys)};
  }
  function drawFaceOverlay(points, type, orientation='front'){
    const b = boundsOf(points);
    const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y+b.h);
    if(type === 'Sandwich Panel'){
      grad.addColorStop(0,'rgba(57,67,75,.50)');
      grad.addColorStop(1,'rgba(19,25,31,.68)');
    } else {
      grad.addColorStop(0,'rgba(122,161,185,.10)');
      grad.addColorStop(.45,'rgba(177,212,231,.08)');
      grad.addColorStop(1,'rgba(17,25,31,.18)');
    }
    drawPoly(points, grad, 'rgba(235,241,246,.06)', 0.9);
    if(type !== 'Sandwich Panel') drawGlassHighlights(points);

    const [p1,p2,p3,p4] = points;
    const rail = 'rgba(18,24,29,.70)';
    drawLine(lerp(p1,p2,.02), lerp(p1,p2,.98), rail, 5.2);
    drawLine(lerp(p4,p3,.02), lerp(p4,p3,.98), rail, 5.6);

    const vline = (t,w=2.4,c='rgba(222,231,237,.50)') => drawLine(lerp(p1,p2,t), lerp(p4,p3,t), c, w);
    const hline = (t,w=2.2,c='rgba(222,231,237,.46)') => drawLine(lerp(p1,p4,t), lerp(p2,p3,t), c, w);
    if(type === 'Fixed Glass'){
      vline(0.5, 1.2, 'rgba(232,239,245,.28)');
    }
    if(type === 'Sliding Door'){
      [0.25,0.5,0.75].forEach(t=>vline(t,2.2,'rgba(234,241,246,.54)'));
      const track = orientation === 'front' ? 0.76 : 0.70;
      vline(track,4.6,'rgba(28,35,41,.84)');
      [0.22,0.49].forEach(t=>{
        const top = lerp(p1,p2,t), bot = lerp(p4,p3,t);
        ctx.fillStyle = 'rgba(239,243,246,.58)';
        ctx.fillRect(top.x-1.6, (top.y+bot.y)/2-14, 3.2, 28);
      });
    }
    if(type === 'Bifold Door'){
      [0.2,0.4,0.6,0.8].forEach(t=>vline(t,2.1,'rgba(234,241,246,.50)'));
      [0.2,0.4,0.6,0.8].forEach(t=>{
        const top = lerp(p1,p2,t), bot = lerp(p4,p3,t);
        ctx.fillStyle = 'rgba(239,243,246,.56)';
        ctx.beginPath(); ctx.arc(top.x, (top.y+bot.y)/2-12, 1.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(top.x, (top.y+bot.y)/2+12, 1.4, 0, Math.PI*2); ctx.fill();
      });
    }
    if(type === 'Guillotine'){
      [0.34,0.68].forEach(t=>hline(t,2.6,'rgba(236,243,248,.56)'));
      ctx.fillStyle = 'rgba(242,245,248,.58)';
      const c = lerp(lerp(p1,p2,.5), lerp(p4,p3,.5), .5);
      ctx.fillRect(c.x-13, c.y-1.7, 26, 3.4);
    }
    if(type === 'Sandwich Panel'){
      for(let t=0.12;t<1;t+=0.12) hline(t,1,'rgba(255,255,255,.08)');
    }
  }
  function drawRoofOverlay(points, roofType){
    const b = boundsOf(points);
    const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y+b.h);
    if(roofType === 'Sandwich Panel'){
      grad.addColorStop(0,'rgba(59,68,76,.32)');
      grad.addColorStop(1,'rgba(28,35,42,.52)');
    } else if(roofType.includes('Pergola')){
      grad.addColorStop(0,'rgba(64,72,80,.22)');
      grad.addColorStop(1,'rgba(25,31,37,.40)');
    } else if(roofType === 'Solid Polycarbonate'){
      grad.addColorStop(0,'rgba(224,238,245,.18)');
      grad.addColorStop(1,'rgba(188,207,219,.22)');
    } else {
      grad.addColorStop(0,'rgba(212,233,244,.06)');
      grad.addColorStop(1,'rgba(46,65,78,.18)');
    }
    drawPoly(points, grad, 'rgba(244,248,251,.10)', 1);
    if(roofType.includes('Pergola')){
      for(let t=0.06;t<1;t+=0.07) drawLine(lerp(points[0],points[1],t), lerp(points[3],points[2],t), roofType === 'Lux Bioclimatic Pergola' ? 'rgba(225,195,138,.54)' : 'rgba(218,224,230,.34)', roofType === 'Lux Bioclimatic Pergola' ? 3.1 : 2.5);
    } else if(roofType === 'Sandwich Panel'){
      for(let t=0.08;t<1;t+=0.08) drawLine(lerp(points[0],points[1],t), lerp(points[3],points[2],t), 'rgba(255,255,255,.07)', 1.1);
    } else {
      drawGlassHighlights(points);
      for(let t=0.18;t<1;t+=0.18) drawLine(lerp(points[0],points[1],t), lerp(points[3],points[2],t), 'rgba(233,243,248,.12)', 1);
    }
  }
  function drawPhotoTag(text, x, y){
    const w = Math.max(130, Math.min(320, text.length*7.2 + 24));
    ctx.fillStyle = 'rgba(8,11,14,.62)';
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 30, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#edf3f7';
    ctx.font = '700 12px Manrope, sans-serif';
    ctx.fillText(text, x+12, y+19);
  }
  function drawResidentialPhotoComposite(d){
    fillPhotoBackdrop('Residential');
    const front = pointSeries([[124,279],[547,346],[565,621],[196,617]]);
    const right = pointSeries([[571,266],[1047,261],[1047,616],[568,621]]);
    const roof = pointSeries([[58,73],[569,98],[1048,103],[551,345]]);
    const base = pointSeries([[168,626],[1055,622],[1042,665],[153,668]]);

    drawPoly(base, 'rgba(26,33,39,.16)', null, 0);
    drawRoofOverlay(roof, d.roof);
    drawFaceOverlay(right, d.sideRight, 'right');
    drawFaceOverlay(front, d.sideFront, 'front');

    [[front[0],front[1]],[front[1],front[2]],[front[2],front[3]],[front[3],front[0]],[right[0],right[1]],[right[1],right[2]],[right[2],right[3]],[right[3],right[0]],[roof[0],roof[1]],[roof[1],roof[2]],[roof[2],roof[3]],[roof[3],roof[0]]].forEach(([a,b],i)=>{
      drawFrameEdge(a,b, i < 4 ? 5.4 : 5.0, i%2 ? 'rgba(27,33,39,.88)' : 'rgba(255,255,255,.16)');
      drawFrameEdge(a,b, 1.0, 'rgba(255,255,255,.14)');
    });

    const floorGlow = ctx.createLinearGradient(front[3].x, front[0].y, front[3].x, front[3].y);
    floorGlow.addColorStop(0,'rgba(255,255,255,0)');
    floorGlow.addColorStop(1,'rgba(255,255,255,.08)');
    drawPoly([front[0], right[0], right[3], front[3]], floorGlow, null, 0);

    drawPhotoTag(`Roof: ${d.roof}`, canvas.width*0.57, canvas.height*0.79);
    drawPhotoTag(`Front: ${d.sideFront}`, canvas.width*0.57, canvas.height*0.84);
    drawPhotoTag(`Right: ${d.sideRight}`, canvas.width*0.57, canvas.height*0.89);
    drawSideBadge(d.sideLeft);
    drawInfoLabel(d);
  }

  function drawPaving(baseY){
    const horizon = baseY - 18;
    const left = 40;
    const right = canvas.width - 34;
    const pave = ctx.createLinearGradient(0,horizon,0,canvas.height);
    pave.addColorStop(0,'rgba(32,39,45,.38)');
    pave.addColorStop(1,'rgba(16,20,24,.95)');
    ctx.fillStyle = pave;
    ctx.beginPath();
    ctx.moveTo(left, horizon);
    ctx.lineTo(right, horizon);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;
    for(let i=0;i<13;i++){
      const t = i/12;
      const y = horizon + Math.pow(t, 1.75) * (canvas.height - horizon - 8);
      ctx.beginPath();
      ctx.moveTo(left + t*26, y);
      ctx.lineTo(right - t*30, y);
      ctx.stroke();
    }
    for(let i=0;i<12;i++){
      const t = i/11;
      ctx.beginPath();
      ctx.moveTo(left + t*(right-left), horizon);
      ctx.lineTo(canvas.width*0.5 + (t-0.5)*canvas.width*0.7, canvas.height);
      ctx.stroke();
    }
  }
  function drawPlanters(baseX, baseY, business){
    const sets = business
      ? [[baseX-130, baseY-10, 34, 42],[baseX+250, baseY-18, 38, 48]]
      : [[baseX-140, baseY-8, 32, 40],[baseX+236, baseY-12, 34, 44]];
    sets.forEach(([x,y,w,h])=>{
      const g = ctx.createLinearGradient(x,y,x,y+h);
      g.addColorStop(0,'rgba(74,80,86,.95)');
      g.addColorStop(1,'rgba(33,37,40,.98)');
      ctx.fillStyle = g;
      ctx.fillRect(x,y,w,h);
      ctx.fillStyle = 'rgba(79,120,74,.95)';
      for(let i=0;i<7;i++){
        ctx.beginPath();
        ctx.ellipse(x + 4 + i*(w-8)/6, y-4-(i%3)*5, 6, 14, (i%2?-.35:.35), 0, Math.PI*2);
        ctx.fill();
      }
    });
  }
  function faceGradient(points, type, sideShade){
    const glassy = type !== 'Sandwich Panel' && type !== 'Empty';
    const g = ctx.createLinearGradient(points[0].x, points[0].y, points[2].x, points[2].y);
    if(glassy){
      g.addColorStop(0, sideShade ? 'rgba(225,240,248,.30)' : 'rgba(235,247,252,.36)');
      g.addColorStop(.28, sideShade ? 'rgba(118,162,182,.20)' : 'rgba(120,170,192,.16)');
      g.addColorStop(.7, sideShade ? 'rgba(56,86,102,.24)' : 'rgba(74,110,128,.18)');
      g.addColorStop(1, sideShade ? 'rgba(20,35,46,.34)' : 'rgba(26,40,54,.28)');
    } else {
      g.addColorStop(0, sideShade ? 'rgba(152,157,163,.95)' : 'rgba(168,173,179,.98)');
      g.addColorStop(1, sideShade ? 'rgba(96,101,107,.98)' : 'rgba(116,121,126,.98)');
    }
    return g;
  }
  function drawGlassHighlights(points){
    ctx.save();
    clipPoly(points);
    const [p1,p2,p3,p4] = points;
    const s1 = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
    s1.addColorStop(0,'rgba(255,255,255,.24)');
    s1.addColorStop(.42,'rgba(255,255,255,.05)');
    s1.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = s1;
    ctx.fillRect(Math.min(p1.x,p4.x)-4, Math.min(p1.y,p2.y)-4, Math.abs(p2.x-p1.x)+32, Math.abs(p4.y-p1.y)+32);
    const s2 = ctx.createLinearGradient(p1.x, p4.y, p2.x, p2.y);
    s2.addColorStop(0,'rgba(132,196,226,.12)');
    s2.addColorStop(.5,'rgba(255,255,255,.04)');
    s2.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = s2;
    ctx.fillRect(Math.min(p1.x,p4.x)-4, Math.min(p1.y,p2.y)-4, Math.abs(p2.x-p1.x)+36, Math.abs(p4.y-p1.y)+36);
    ctx.restore();
  }
  function drawFrameEdge(a,b,thickness,color){
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    drawLine(a,b,color,thickness);
  }
  function drawFrontFace(p1,p2,p3,p4,type){
    if(type === 'Empty'){
      drawFrameEdge(p1,p2,5,'rgba(219,226,231,.82)');
      drawFrameEdge(p2,p3,5,'rgba(219,226,231,.9)');
      drawFrameEdge(p3,p4,5,'rgba(219,226,231,.82)');
      drawFrameEdge(p4,p1,5,'rgba(219,226,231,.9)');
      return;
    }
    drawPoly([p1,p2,p3,p4], faceGradient([p1,p2,p3,p4], type, false), 'rgba(255,255,255,.22)', 1.2);
    if(type !== 'Sandwich Panel') drawGlassHighlights([p1,p2,p3,p4]);

    ctx.fillStyle = 'rgba(52,60,68,.95)';
    const topRailY = p1.y + 6;
    const bottomRailY = p4.y - 7;
    ctx.fillRect(p1.x+5, topRailY, (p2.x-p1.x)-10, 4);
    ctx.fillRect(p1.x+5, bottomRailY, (p2.x-p1.x)-10, 4);

    if(type === 'Sandwich Panel'){
      for(let t=0.12;t<1;t+=0.12) drawLine(lerp(p1,p4,t), lerp(p2,p3,t), 'rgba(255,255,255,.08)', 1);
      return;
    }
    if(type === 'Fixed Glass'){
      drawLine(lerp(p1,p2,.5), lerp(p4,p3,.5), 'rgba(255,255,255,.38)', 1.2);
    }
    if(type === 'Sliding Door'){
      [0.33,0.66].forEach(t => drawLine(lerp(p1,p2,t), lerp(p4,p3,t), 'rgba(243,248,251,.55)', 2));
      drawLine(lerp(p1,p2,.67), lerp(p4,p3,.67), 'rgba(70,78,85,.9)', 4.2);
      [0.29,0.61].forEach(t => {
        const top = lerp(p1,p2,t), bot = lerp(p4,p3,t);
        ctx.fillStyle = 'rgba(255,255,255,.64)';
        ctx.fillRect(top.x-1.5, (top.y+bot.y)/2-12, 3, 24);
      });
    }
    if(type === 'Bifold Door'){
      [0.25,0.5,0.75].forEach(t => drawLine(lerp(p1,p2,t), lerp(p4,p3,t), 'rgba(243,248,251,.52)', 1.8));
      [0.25,0.5,0.75].forEach(t => {
        const top = lerp(p1,p2,t), bot = lerp(p4,p3,t);
        ctx.fillStyle = 'rgba(255,255,255,.62)';
        ctx.beginPath(); ctx.arc(top.x, (top.y+bot.y)/2-10, 1.3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(top.x, (top.y+bot.y)/2+10, 1.3, 0, Math.PI*2); ctx.fill();
      });
    }
    if(type === 'Guillotine'){
      [0.34,0.68].forEach(t => drawLine(lerp(p1,p4,t), lerp(p2,p3,t), 'rgba(243,248,251,.58)', 2));
      ctx.fillStyle = 'rgba(255,255,255,.62)';
      ctx.fillRect((p1.x+p2.x)/2-11, (p1.y+p4.y)/2-1.5, 22, 3);
    }
  }
  function drawRightFace(p1,p2,p3,p4,type){
    if(type === 'Empty'){
      drawFrameEdge(p1,p2,5,'rgba(219,226,231,.82)');
      drawFrameEdge(p2,p3,5,'rgba(219,226,231,.9)');
      drawFrameEdge(p3,p4,5,'rgba(219,226,231,.82)');
      drawFrameEdge(p4,p1,5,'rgba(219,226,231,.9)');
      return;
    }
    drawPoly([p1,p2,p3,p4], faceGradient([p1,p2,p3,p4], type, true), 'rgba(255,255,255,.18)', 1.2);
    if(type !== 'Sandwich Panel') drawGlassHighlights([p1,p2,p3,p4]);

    if(type === 'Sandwich Panel'){
      for(let t=0.15;t<1;t+=0.15) drawLine(lerp(p1,p4,t), lerp(p2,p3,t), 'rgba(255,255,255,.08)', 1);
      return;
    }
    if(type === 'Fixed Glass') drawLine(lerp(p1,p2,.5), lerp(p4,p3,.5), 'rgba(255,255,255,.38)', 1.2);
    if(type === 'Sliding Door'){
      [0.33,0.66].forEach(t => drawLine(lerp(p1,p2,t), lerp(p4,p3,t), 'rgba(243,248,251,.54)', 1.8));
      drawLine(lerp(p1,p2,.67), lerp(p4,p3,.67), 'rgba(70,78,85,.9)', 4);
    }
    if(type === 'Bifold Door') [0.25,0.5,0.75].forEach(t => drawLine(lerp(p1,p2,t), lerp(p4,p3,t), 'rgba(243,248,251,.52)', 1.7));
    if(type === 'Guillotine') [0.34,0.68].forEach(t => drawLine(lerp(p1,p4,t), lerp(p2,p3,t), 'rgba(243,248,251,.56)', 1.9));
  }
  function drawRoof(roofPts, roofType){
    const roofBase = roofColors[roofType] || 'rgba(196,205,213,.64)';
    const grad = ctx.createLinearGradient(roofPts[0].x, roofPts[0].y, roofPts[2].x, roofPts[2].y);
    if(roofType === 'Sandwich Panel'){
      grad.addColorStop(0,'rgba(206,211,216,.98)');
      grad.addColorStop(1,'rgba(124,131,138,.98)');
    } else if(roofType.includes('Pergola')){
      grad.addColorStop(0, roofType === 'Lux Bioclimatic Pergola' ? 'rgba(242,244,246,.98)' : 'rgba(222,226,230,.98)');
      grad.addColorStop(1,'rgba(125,132,140,.98)');
    } else {
      grad.addColorStop(0,'rgba(232,245,250,.32)');
      grad.addColorStop(.35,'rgba(182,225,241,.18)');
      grad.addColorStop(1,'rgba(36,57,70,.34)');
    }
    drawPoly(roofPts, grad, 'rgba(255,255,255,.22)', 1.2);

    if(roofType.includes('Pergola')){
      for(let t=0.08; t<1; t+=0.08){
        const a = lerp(roofPts[0], roofPts[1], t);
        const b = lerp(roofPts[3], roofPts[2], t);
        drawLine(a,b, roofType === 'Lux Bioclimatic Pergola' ? 'rgba(96,103,112,.95)' : 'rgba(79,89,98,.88)', roofType === 'Lux Bioclimatic Pergola' ? 2.7 : 2.4);
      }
      if(roofType === 'Lux Bioclimatic Pergola'){
        const edge = ctx.createLinearGradient(roofPts[0].x, roofPts[0].y, roofPts[2].x, roofPts[2].y);
        edge.addColorStop(0,'rgba(255,212,139,.55)');
        edge.addColorStop(1,'rgba(255,212,139,0)');
        drawPoly([
          lerp(roofPts[0],roofPts[1],.02), lerp(roofPts[0],roofPts[1],.98), lerp(roofPts[3],roofPts[2],.98), lerp(roofPts[3],roofPts[2],.02)
        ], edge, null, 0);
      }
    } else if(roofType === 'Fixed Glass' || roofType === 'Solid Polycarbonate'){
      for(let t=0.17; t<1; t+=0.17){
        drawLine(lerp(roofPts[0], roofPts[1], t), lerp(roofPts[3], roofPts[2], t), 'rgba(255,255,255,.16)', 1);
      }
      ctx.save();
      clipPoly(roofPts);
      const ref = ctx.createLinearGradient(roofPts[0].x, roofPts[0].y, roofPts[2].x, roofPts[2].y);
      ref.addColorStop(0,'rgba(255,255,255,.22)');
      ref.addColorStop(.2,'rgba(255,255,255,.04)');
      ref.addColorStop(.6,'rgba(120,176,201,.06)');
      ref.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle = ref;
      ctx.fillRect(roofPts[0].x-10, roofPts[0].y-10, roofPts[1].x-roofPts[0].x+40, roofPts[2].y-roofPts[0].y+40);
      ctx.restore();
    }
    drawFrameEdge(roofPts[0], roofPts[1], 5, 'rgba(220,227,232,.8)');
    drawFrameEdge(roofPts[1], roofPts[2], 5, 'rgba(199,206,212,.82)');
    drawFrameEdge(roofPts[2], roofPts[3], 5, 'rgba(187,195,201,.76)');
    drawFrameEdge(roofPts[3], roofPts[0], 5, 'rgba(216,223,229,.82)');
  }
  function drawInterior(d, fbl, fbr, ftr, ftl){
    const width = fbr.x - fbl.x;
    const floorY = fbl.y - 2;
    ctx.save();
    clipPoly([fbl, fbr, ftr, ftl]);
    const g = ctx.createLinearGradient(fbl.x, ftl.y, fbl.x, fbl.y);
    g.addColorStop(0,'rgba(255,214,156,.18)');
    g.addColorStop(1,'rgba(42,32,23,.20)');
    ctx.fillStyle = g;
    ctx.fillRect(fbl.x, ftl.y, width, fbl.y-ftl.y);

    ctx.fillStyle = 'rgba(58,39,24,.45)';
    ctx.fillRect(fbl.x+18, floorY-16, width-36, 16);
    for(let i=0;i<5;i++){
      const x = fbl.x + 26 + i*((width-64)/4);
      ctx.fillStyle = 'rgba(77,58,39,.55)';
      ctx.fillRect(x, floorY-44, 6, 28);
      ctx.fillRect(x+18, floorY-44, 6, 28);
      ctx.fillStyle = 'rgba(95,72,50,.52)';
      ctx.fillRect(x-2, floorY-50, 30, 8);
    }

    ctx.fillStyle = 'rgba(255,210,140,.28)';
    if(d.projectType === 'Business'){
      ctx.beginPath(); ctx.ellipse(fbl.x + width*0.22, floorY-56, 26, 9, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(fbl.x + width*0.64, floorY-58, 28, 10, 0, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(fbl.x + width*0.32, floorY-62, 32, 12, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
  function drawSideBadge(type){
    const x = 20, y = 18, w = 172, h = 94;
    ctx.fillStyle = 'rgba(8,11,14,.58)';
    ctx.strokeStyle = 'rgba(255,255,255,.11)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f0c98b';
    ctx.font = '700 13px Manrope, sans-serif';
    ctx.fillText('Left side selection', x+14, y+20);
    const a={x:x+18,y:y+72}, b={x:x+110,y:y+72}, c={x:x+110,y:y+34}, d={x:x+18,y:y+34};
    drawFrontFace(d,c,b,a,type);
    ctx.fillStyle = '#f4f7f9';
    ctx.font = '700 12px Manrope, sans-serif';
    ctx.fillText(type, x+14, y+h-10);
  }
  function drawInfoLabel(d){
    const text1 = `${d.projectType} visual concept`;
    const text2 = `Approx. size ${d.length || '-'}m × ${d.width || '-'}m × ${d.height || '-'}m`;
    const x = 22, y = canvas.height - 64, w = 268, h = 44;
    ctx.fillStyle = 'rgba(8,11,14,.52)';
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#edf4f8';
    ctx.font = '700 13px Manrope, sans-serif';
    ctx.fillText(text1, x+14, y+17);
    ctx.fillStyle = '#d5dee4';
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.fillText(text2, x+14, y+33);
  }

  function draw(){
    if(!ctx) return;
    const d = getData();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled = true;

    if(d.projectType === 'Residential'){
      drawResidentialPhotoComposite(d);
    } else {
      fillPhotoBackdrop(d.projectType);

      const L = Math.max(d.length, 1.5);
      const W = Math.max(d.width, 1.5);
      const H = Math.max(d.height, 2.0);
      const scale = Math.min(canvas.width * 0.28 / (L + W*0.66), canvas.height * 0.34 / H);
      const width = L * scale;
      const depth = W * scale * 0.84;
      const height = H * scale;
      const depthY = depth * 0.44;
      const pitchDrop = (d.pitch / 25) * Math.min(28, height * 0.18);

      const x = canvas.width * 0.25;
      const y = canvas.height * 0.79;
      drawPaving(y + 6);

      const fbl = {x, y};
      const fbr = {x:x+width, y};
      const ftl = {x, y:y-height};
      const ftr = {x:x+width, y:y-height};
      const sbr = {x:fbr.x+depth, y:fbr.y-depthY};
      const str = {x:ftr.x+depth, y:ftr.y-depthY-pitchDrop};
      const stl = {x:ftl.x+depth, y:ftl.y-depthY-pitchDrop};

      const shadow = ctx.createRadialGradient(x + width*0.66, y + 10, 40, x + width*0.66, y + 10, width*1.05);
      shadow.addColorStop(0,'rgba(0,0,0,.34)');
      shadow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.ellipse(x + width*0.66, y + 10, width*0.88, 38, -0.08, 0, Math.PI*2);
      ctx.fill();

      drawInterior(d, fbl, fbr, ftr, ftl);
      drawRoof([ftl, ftr, str, stl], d.roof);
      drawRightFace(fbr, sbr, str, ftr, d.sideRight);
      drawFrontFace(fbl, fbr, ftr, ftl, d.sideFront);

      [
        [fbl,fbr],[fbr,sbr],[fbl,ftl],[fbr,ftr],[sbr,str],[ftl,ftr],[ftl,stl],[ftr,str],[stl,str]
      ].forEach(([a,b], i)=>drawFrameEdge(a,b, i < 3 ? 6 : 5, i % 2 ? 'rgba(192,200,206,.84)' : 'rgba(225,232,237,.88)'));

      drawPlanters(x, y, true);
      drawSideBadge(d.sideLeft);
      drawInfoLabel(d);
    }

    if(summaryEls.project){
      summaryEls.project.textContent = d.projectType;
      summaryEls.dims.textContent = `${d.length || '-'}m × ${d.width || '-'}m × ${d.height || '-'}m`;
      summaryEls.roof.textContent = `${d.roof}`;
      summaryEls.left.textContent = d.sideLeft;
      summaryEls.front.textContent = d.sideFront;
      summaryEls.right.textContent = d.sideRight;
      summaryEls.notes.textContent = d.notes ? d.notes : 'No additional notes yet.';
      summaryEls.legend.innerHTML = `
        <span class="legend-chip"><i style="background:${roofColors[d.roof] || 'rgba(190,200,210,.5)'}"></i>Roof</span>
        <span class="legend-chip"><i style="background:${faceColors[d.sideLeft] || 'rgba(165,185,195,.22)'}"></i>Left</span>
        <span class="legend-chip"><i style="background:${faceColors[d.sideFront] || 'rgba(165,185,195,.22)'}"></i>Front</span>
        <span class="legend-chip"><i style="background:${faceColors[d.sideRight] || 'rgba(165,185,195,.22)'}"></i>Right</span>
      `;
    }
  }

  form.addEventListener('input', draw);
  draw();
  updateStep();

  function calcEstimate(d){
    const roofArea = d.length * d.width;
    const leftArea = d.width * d.height;
    const frontArea = d.length * d.height;
    const rightArea = d.width * d.height;
    const roofCost = roofArea * (roofRates[d.roof] || 0) * DISCOUNT;
    const leftCost = leftArea * (sideRates[d.sideLeft] || 0) * DISCOUNT;
    const frontCost = frontArea * (sideRates[d.sideFront] || 0) * DISCOUNT;
    const rightCost = rightArea * (sideRates[d.sideRight] || 0) * DISCOUNT;
    return {
      roofArea,leftArea,frontArea,rightArea,
      roofCost,leftCost,frontCost,rightCost,
      total: roofCost + leftCost + frontCost + rightCost
    };
  }

  const designerSoonBtn = document.querySelector('#designerSoonBtn');
  if(designerSoonBtn){
    designerSoonBtn.addEventListener('click', function(e){
      e.preventDefault();
      window.alert('3D Veranda Designer — coming soon.');
    });
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(!validateStep(current)) return;
    const d = getData();
    const resultBox = document.querySelector('#quoteResult');
    const msg = [
      'Hello Hawk Outdoor, I would like a quotation.',
      '',
      `Project type: ${d.projectType}`,
      `Dimensions: ${d.length}m x ${d.width}m x ${d.height}m`,
      `Roof: ${d.roof}`,
      `Left side: ${d.sideLeft}`,
      `Front side: ${d.sideFront}`,
      `Right side: ${d.sideRight}`,
      d.location ? `Area/Postcode: ${d.location}` : '',
      d.name ? `Name: ${d.name}` : '',
      d.email ? `Email: ${d.email}` : '',
      d.notes ? `Notes: ${d.notes}` : ''
    ].filter(Boolean).join('\n');
    const wa = document.querySelector('#whatsAppLink');
    wa.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    resultBox.classList.add('active');

    if(mode === 'admin'){
      const estimate = calcEstimate(d);
      const priceBox = document.querySelector('#priceBox');
      const breakdown = document.querySelector('#priceBreakdown');
      breakdown.innerHTML = `
        <div class="price-row"><span>Roof — ${d.roof}</span><strong>${fmt.format(estimate.roofCost)}</strong></div>
        <div class="price-row"><span>Left side — ${d.sideLeft}</span><strong>${fmt.format(estimate.leftCost)}</strong></div>
        <div class="price-row"><span>Front side — ${d.sideFront}</span><strong>${fmt.format(estimate.frontCost)}</strong></div>
        <div class="price-row"><span>Right side — ${d.sideRight}</span><strong>${fmt.format(estimate.rightCost)}</strong></div>
        <div class="total-row"><span>Total estimate</span><span>${fmt.format(estimate.total)} (±10%)</span></div>
      `;
      priceBox.classList.add('active');
    }
  });
})();
