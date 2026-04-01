  (() => {
    const state = {
      width: 5000,
      projection: 3000,
      height: 2600,
      color: 'Anthracite Grey',
      roof: 'Fixed Glass',
      front: 'Sliding Door',
      left: 'Sliding Door',
      right: 'Fixed Glass',
      wedges: 'yes',
      lighting: 'warm',
      yaw: -0.72,
      pitch: 0.56,
      zoom: 0.72
    };

    const colorMap = {
      'Anthracite Grey': '#383E42',
      'Jet Black': '#1f2327',
      'Traffic White': '#F3F5F7',
      'Earth Bronze': '#4c3a2f'
    };

    const roofOptions = [
      ['Fixed Glass', 'roof-glass', 'Clear glazed roof with slim rafters.'],
      ['Sandwich Panel', 'roof-panel', 'Opaque insulated aluminium roof.'],
      ['Pergola', 'roof-slat', 'Open slatted pergola roof.'],
      ['Bioclimatic Pergola', 'roof-slat', 'Adjustable aluminium blade roof.'],
      ['Lux Bioclimatic Pergola', 'roof-slat', 'Premium wide-blade roof system.'],
      ['Solid Polycarbonate', 'roof-panel', 'Frosted solid polycarbonate roof panels.']
    ];

    const sideOptions = [
      ['Sliding Door', 'sliding', 'Smooth multi-panel sliding glass system.'],
      ['Fixed Glass', 'glass', 'Large uninterrupted glazed panels.'],
      ['Bifold Door', 'bifold', 'Folding glass panels for wider opening.'],
      ['Guillotine', 'guillotine', 'Vertical sliding sash-style glazing.'],
      ['Sandwich Panel', 'sandwich', 'Solid insulated aluminium panel.'],
      ['Empty', 'glass', 'Leave this side open.']
    ];

    const canvas = document.getElementById('sceneCanvas');
    const ctx = canvas.getContext('2d');
    const widthChip = document.getElementById('widthChip');
    const projectionChip = document.getElementById('projectionChip');
    const heightChip = document.getElementById('heightChip');
    const sceneRoofPill = document.getElementById('sceneRoofPill');
    const sceneSidePill = document.getElementById('sceneSidePill');
    const roofSummary = document.getElementById('roofSummary');
    const enclosureSummary = document.getElementById('enclosureSummary');
    const roofWrap = document.getElementById('roofOptions');
    const sideWrap = document.getElementById('sideOptions');
    const swatchWrap = document.getElementById('colorSwatches');
    const sideTabs = [...document.querySelectorAll('[data-side]')];
    const wedgeButtons = [...document.querySelectorAll('[data-wedges]')];
    const lightingButtons = [...document.querySelectorAll('[data-lighting]')];
    const openFullscreenBtn = document.getElementById('openFullscreenBtn');
    const sendInquiryBtn = document.getElementById('sendInquiryBtn');
    const fullscreenTarget = document.getElementById('fullscreenTarget');
    const inputs = {
      width: [document.getElementById('widthInput'), document.getElementById('widthNumber')],
      projection: [document.getElementById('projectionInput'), document.getElementById('projectionNumber')],
      height: [document.getElementById('heightInput'), document.getElementById('heightNumber')]
    };

    let activeSide = 'front';
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function mm(n){ return `${Math.round(n)}mm`; }
    function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
    function lerp(a,b,t){ return a + (b-a)*t; }
    function ptLerp(a,b,t){ return {x:lerp(a.x,b.x,t), y:lerp(a.y,b.y,t), z:lerp(a.z,b.z,t)}; }
    function hexToRgb(hex){
      let h = hex.replace('#','');
      if(h.length === 3) h = h.split('').map(c => c + c).join('');
      const n = parseInt(h, 16);
      return {r:(n>>16)&255, g:(n>>8)&255, b:n&255};
    }
    function rgba(hex, a){ const c = hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; }
    function shade(hex, amt){
      const c = hexToRgb(hex);
      const mix = (x) => clamp(Math.round(x + (amt >= 0 ? (255-x)*amt : x*amt)), 0, 255);
      return `rgb(${mix(c.r)},${mix(c.g)},${mix(c.b)})`;
    }
    function syncInputs(key, value){ inputs[key].forEach(el => el.value = value); }

    Object.entries(inputs).forEach(([key, pair]) => {
      pair.forEach(el => el.addEventListener('input', () => {
        const min = Number(el.min || 0);
        const max = Number(el.max || 10000);
        const value = clamp(Number(el.value || state[key]), min, max);
        state[key] = value;
        syncInputs(key, value);
        updateUi();
        render();
      }));
    });

    function makeColorSwatches(){
      swatchWrap.innerHTML = Object.entries(colorMap).map(([label, hex]) => `
        <button type="button" class="swatch ${state.color === label ? 'active' : ''}" data-color="${label}">
          <span class="dot" style="background:${hex}"></span>
          <span>${label}</span>
        </button>
      `).join('');
      swatchWrap.querySelectorAll('[data-color]').forEach(btn => btn.addEventListener('click', () => {
        state.color = btn.dataset.color;
        makeColorSwatches();
        render();
      }));
    }

    function makeRoofCards(){
      roofWrap.innerHTML = roofOptions.map(([name, icon, desc]) => `
        <button type="button" class="choice ${state.roof === name ? 'active' : ''}" data-roof="${name}">
          <span class="icon ${icon}"></span>
          <span><strong>${name}</strong><span>${desc}</span></span>
        </button>`).join('');
      roofWrap.querySelectorAll('[data-roof]').forEach(btn => btn.addEventListener('click', () => {
        state.roof = btn.dataset.roof;
        makeRoofCards();
        updateUi();
        render();
      }));
    }

    function makeSideCards(){
      sideWrap.innerHTML = sideOptions.map(([name, icon, desc]) => `
        <button type="button" class="option ${state[activeSide] === name ? 'active' : ''}" data-side-option="${name}">
          <span class="icon ${icon}"></span>
          <span><strong>${name}</strong><span>${desc}</span></span>
        </button>`).join('');
      sideWrap.querySelectorAll('[data-side-option]').forEach(btn => btn.addEventListener('click', () => {
        state[activeSide] = btn.dataset.sideOption;
        makeSideCards();
        updateUi();
        render();
      }));
    }

    sideTabs.forEach(btn => btn.addEventListener('click', () => {
      activeSide = btn.dataset.side;
      sideTabs.forEach(el => el.classList.toggle('active', el.dataset.side === activeSide));
      makeSideCards();
      updateUi();
    }));
    wedgeButtons.forEach(btn => btn.addEventListener('click', () => {
      state.wedges = btn.dataset.wedges;
      wedgeButtons.forEach(el => el.classList.toggle('active', el.dataset.wedges === state.wedges));
      render();
    }));
    lightingButtons.forEach(btn => btn.addEventListener('click', () => {
      state.lighting = btn.dataset.lighting;
      lightingButtons.forEach(el => el.classList.toggle('active', el.dataset.lighting === state.lighting));
      render();
    }));

    function updateUi(){
      widthChip.textContent = `Width • ${mm(state.width)}`;
      projectionChip.textContent = `Projection • ${mm(state.projection)}`;
      heightChip.textContent = `Height • ${mm(state.height)}`;
      sceneRoofPill.textContent = `Roof • ${state.roof}`;
      sceneSidePill.textContent = `${activeSide.charAt(0).toUpperCase()+activeSide.slice(1)} • ${state[activeSide]}`;
      roofSummary.textContent = `Current roof: ${state.roof}`;
      enclosureSummary.innerHTML = `Front: ${state.front}<br>Left: ${state.left} &nbsp;&nbsp; Right: ${state.right}`;
    }

    function project(p, yaw, pitch, dist){
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const x1 = p.x * cy - p.z * sy;
      const z1 = p.x * sy + p.z * cy;
      const y1 = p.y;
      const y2 = y1 * cp - z1 * sp;
      const z2 = y1 * sp + z1 * cp + dist;
      return {x:x1 / z2, y:y2 / z2, z:z2};
    }

    function buildModel(){
      const color = colorMap[state.color];
      const frameDark = shade(color, -0.18);
      const frameLight = shade(color, 0.16);
      const glassFill = 'rgba(190,216,232,0.34)';
      const glassStroke = 'rgba(56,88,106,0.42)';

      const W = state.width / 1200;
      const D = state.projection / 1180;
      const HF = 2200 / 980;
      const HB = clamp(state.height, 2200, 2700) / 980;

      const A = {x:-W/2,y:0,z:D/2};
      const B = {x: W/2,y:0,z:D/2};
      const C = {x: W/2,y:0,z:-D/2};
      const Dp= {x:-W/2,y:0,z:-D/2};
      const E = {x:-W/2,y:HF,z:D/2};
      const F = {x: W/2,y:HF,z:D/2};
      const G = {x: W/2,y:HB,z:-D/2};
      const H = {x:-W/2,y:HB,z:-D/2};

      const faces = [];
      const beams = [];
      const lights = [];
      const decor = [];
      const bbox = [A,B,C,Dp,E,F,G,H,{x:-W*0.85,y:0,z:D*0.82},{x:W*0.85,y:0,z:-D*0.82}];

      const addFace = (pts, fill, stroke='rgba(0,0,0,.10)', line=1.2, kind='solid') => faces.push({pts, fill, stroke, line, kind});
      const addBeam = (a,b,w,col=frameDark, hi=frameLight) => beams.push({a,b,w,col,hi});
      const addGlass = (pts) => addFace(pts, glassFill, glassStroke, 1.1, 'glass');

      // patio slab only
      addFace([
        {x:-W*0.78,y:-0.02,z:D*0.82}, {x:W*0.78,y:-0.02,z:D*0.82},
        {x:W*0.82,y:-0.02,z:-D*0.84}, {x:-W*0.82,y:-0.02,z:-D*0.84}
      ], '#dad2c9', 'rgba(131,123,113,.16)', 1, 'ground');
      addFace([A,B,C,Dp], '#cfc7be', 'rgba(131,123,113,.14)', 1, 'ground');

      // furniture for scale
      decor.push({type:'box', p:{x:-W*0.16,y:0.02,z:0.05}, sx:0.50, sy:0.18, sz:0.82, c:'#d8d2cb'});
      decor.push({type:'box', p:{x:W*0.18,y:0.02,z:0.00}, sx:0.56, sy:0.18, sz:0.82, c:'#d8d2cb'});
      decor.push({type:'box', p:{x:0,y:0.02,z:0.34}, sx:0.32, sy:0.12, sz:0.52, c:'#c6bdb4'});

      function addRectVolume(center, sx, sy, sz, color){
        const x=center.x, y=center.y, z=center.z;
        const p=[
          {x:x-sx/2,y:y,z:z+sz/2},{x:x+sx/2,y:y,z:z+sz/2},{x:x+sx/2,y:y,z:z-sz/2},{x:x-sx/2,y:y,z:z-sz/2},
          {x:x-sx/2,y:y+sy,z:z+sz/2},{x:x+sx/2,y:y+sy,z:z+sz/2},{x:x+sx/2,y:y+sy,z:z-sz/2},{x:x-sx/2,y:y+sy,z:z-sz/2}
        ];
        addFace([p[0],p[1],p[5],p[4]], shade(color,0.06), 'rgba(0,0,0,.06)', 1, 'decor');
        addFace([p[1],p[2],p[6],p[5]], shade(color,-0.07), 'rgba(0,0,0,.06)', 1, 'decor');
        addFace([p[0],p[1],p[2],p[3]], shade(color,-0.12), 'rgba(0,0,0,.06)', 1, 'decor');
      }

      function addFrontSystem(type){
        if(type === 'Empty') return;
        if(type === 'Sandwich Panel') { addFace([A,B,F,E], '#dfe3e7', 'rgba(102,109,116,.32)', 1.3, 'panel'); return; }
        if(type === 'Guillotine'){
          for(let i=0;i<3;i++){
            const t0=i/3, t1=(i+1)/3;
            addGlass([ptLerp(A,E,t0), ptLerp(B,F,t0), ptLerp(B,F,t1), ptLerp(A,E,t1)]);
            if(i<2) addBeam(ptLerp(A,E,t1), ptLerp(B,F,t1), 0.05);
          }
          return;
        }
        const count = type === 'Bifold Door' ? 5 : type === 'Sliding Door' ? 4 : 2;
        for(let i=0;i<count;i++){
          const t0=i/count, t1=(i+1)/count;
          addGlass([ptLerp(A,B,t0), ptLerp(A,B,t1), ptLerp(E,F,t1), ptLerp(E,F,t0)]);
          if(i<count-1) addBeam(ptLerp(A,B,t1), ptLerp(E,F,t1), 0.048);
        }
      }
      function addSideSystem(type, frontBottom, backBottom, frontTop, backTop){
        if(type === 'Empty') return;
        if(type === 'Sandwich Panel') { addFace([frontBottom,backBottom,backTop,frontTop], '#dfe3e7', 'rgba(102,109,116,.32)', 1.3, 'panel'); return; }
        if(type === 'Guillotine'){
          for(let i=0;i<3;i++){
            const t0=i/3, t1=(i+1)/3;
            addGlass([ptLerp(frontBottom,frontTop,t0), ptLerp(backBottom,backTop,t0), ptLerp(backBottom,backTop,t1), ptLerp(frontBottom,frontTop,t1)]);
            if(i<2) addBeam(ptLerp(frontBottom,frontTop,t1), ptLerp(backBottom,backTop,t1), 0.05);
          }
          return;
        }
        const count = type === 'Bifold Door' ? 5 : type === 'Sliding Door' ? 4 : 2;
        for(let i=0;i<count;i++){
          const t0=i/count, t1=(i+1)/count;
          addGlass([ptLerp(frontBottom,backBottom,t0), ptLerp(frontBottom,backBottom,t1), ptLerp(frontTop,backTop,t1), ptLerp(frontTop,backTop,t0)]);
          if(i<count-1) addBeam(ptLerp(frontBottom,backBottom,t1), ptLerp(frontTop,backTop,t1), 0.046);
        }
      }

      addFrontSystem(state.front);
      addSideSystem(state.left, A, Dp, E, H);
      addSideSystem(state.right, B, C, F, G);

      if(state.wedges === 'yes'){
        addGlass([Dp, A, E]);
        addGlass([Dp, E, H]);
        addGlass([B, C, G]);
        addGlass([B, G, F]);
      }

      if(['Fixed Glass','Sandwich Panel','Solid Polycarbonate'].includes(state.roof)){
        const n=5;
        for(let i=0;i<n;i++){
          const t0=i/n, t1=(i+1)/n;
          const p1=ptLerp(E,F,t0), p2=ptLerp(E,F,t1), p3=ptLerp(H,G,t1), p4=ptLerp(H,G,t0);
          let fill=glassFill;
          if(state.roof==='Sandwich Panel') fill='#e1e5e8';
          if(state.roof==='Solid Polycarbonate') fill='rgba(225,230,234,.78)';
          addFace([p1,p2,p3,p4], fill, state.roof==='Sandwich Panel' ? 'rgba(104,110,116,.28)' : glassStroke, 1.1, state.roof==='Sandwich Panel' ? 'panel' : 'glass');
        }
      } else {
        let count = 8, widthFactor = 0.42, frontTilt = 0.01, backTilt = 0.01, slatColor = frameLight;
        if(state.roof === 'Bioclimatic Pergola'){
          count = 12; widthFactor = 0.76; frontTilt = 0.10; backTilt = -0.02; slatColor = shade(color, 0.12);
        }
        if(state.roof === 'Lux Bioclimatic Pergola'){
          count = 9; widthFactor = 0.88; frontTilt = 0.12; backTilt = -0.03; slatColor = shade(color, 0.16);
        }
        for(let i=0;i<count;i++){
          const centerT = (i + 0.5) / count;
          const half = (widthFactor / count) / 2;
          const t0 = clamp(centerT - half, 0, 1);
          const t1 = clamp(centerT + half, 0, 1);
          const zf=lerp(D/2,-D/2,t0), zb=lerp(D/2,-D/2,t1);
          const yF=lerp(HF,HB,t0), yB=lerp(HF,HB,t1);
          addFace([
            {x:-W/2,y:yF+frontTilt,z:zf},{x:W/2,y:yF+frontTilt,z:zf},
            {x:W/2,y:yB+backTilt,z:zb},{x:-W/2,y:yB+backTilt,z:zb}
          ], slatColor, 'rgba(0,0,0,.08)', 1, 'slat');
        }
      }

      [[A,E,0.16],[B,F,0.16],[C,G,0.16],[Dp,H,0.16],[E,F,0.15],[F,G,0.15],[G,H,0.15],[H,E,0.15],[A,B,0.14],[B,C,0.14],[C,Dp,0.14],[Dp,A,0.14]].forEach(([a,b,w]) => addBeam(a,b,w));
      const rafters = state.roof === 'Lux Bioclimatic Pergola' ? 6 : 5;
      for(let i=1;i<rafters;i++) addBeam(ptLerp(E,F,i/rafters), ptLerp(H,G,i/rafters), 0.10, frameDark, frameLight);

      if(state.lighting !== 'none'){
        const glow = state.lighting === 'warm' ? 'rgba(255,214,145,.95)' : 'rgba(205,236,255,.9)';
        const spots = 5;
        for(let i=0;i<spots;i++){
          const t = (i+0.5)/spots;
          lights.push({center:ptLerp(ptLerp(E,F,t), ptLerp(H,G,t), 0.33), glow});
        }
      }

      decor.forEach(d => addRectVolume(d.p,d.sx,d.sy,d.sz,d.c));
      return {faces, beams, lights, bbox};
    }

    function resizeCanvas(){
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if(canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
      ctx.setTransform(dpr,0,0,dpr,0,0);
      return {w:rect.width, h:rect.height};
    }

    function drawFace(pts, fill, stroke, line){
      ctx.beginPath();
      pts.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if(stroke && line > 0){
        ctx.lineWidth = line;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
    }

    function beamPoly(a,b,w){
      const dx=b.x-a.x, dy=b.y-a.y;
      const len=Math.hypot(dx,dy)||1;
      const nx=-dy/len, ny=dx/len;
      const ox=nx*w/2, oy=ny*w/2;
      return [
        {x:a.x+ox,y:a.y+oy},{x:b.x+ox,y:b.y+oy},{x:b.x-ox,y:b.y-oy},{x:a.x-ox,y:a.y-oy}
      ];
    }

    function render(){
      const {w,h} = resizeCanvas();
      ctx.clearRect(0,0,w,h);

      // sky and ground
      const sky = ctx.createLinearGradient(0,0,0,h);
      sky.addColorStop(0,'#dbe8f5');
      sky.addColorStop(.46,'#f5f8fb');
      sky.addColorStop(1,'#f4efe8');
      ctx.fillStyle = sky;
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#e7dfd5';
      ctx.fillRect(0,h*0.64,w,h*0.36);

      // fixed realistic house backdrop - does not scale with veranda dimensions
      const houseX = w * 0.11;
      const houseY = h * 0.12;
      const houseW = w * 0.58;
      const houseH = h * 0.47;
      const brick = '#b47458';
      const brickDark = '#8e5b45';

      // house shadow
      ctx.fillStyle = 'rgba(0,0,0,.08)';
      ctx.beginPath();
      ctx.ellipse(houseX + houseW*0.50, houseY + houseH + 36, houseW*0.38, 26, 0, 0, Math.PI*2);
      ctx.fill();

      // main walls
      ctx.fillStyle = brick;
      ctx.fillRect(houseX, houseY + houseH*0.18, houseW*0.62, houseH*0.82);
      ctx.fillRect(houseX + houseW*0.62, houseY + houseH*0.28, houseW*0.24, houseH*0.72);
      ctx.fillStyle = '#c38d6e';
      ctx.fillRect(houseX + houseW*0.86, houseY + houseH*0.42, houseW*0.10, houseH*0.58);

      // brick lines
      ctx.strokeStyle = rgba(brickDark,0.20);
      ctx.lineWidth = 1;
      for(let y = houseY + houseH*0.22; y < houseY + houseH; y += 10){
        ctx.beginPath();
        ctx.moveTo(houseX, y);
        ctx.lineTo(houseX + houseW*0.96, y);
        ctx.stroke();
      }

      // roof
      ctx.fillStyle = '#43484d';
      ctx.beginPath();
      ctx.moveTo(houseX - 16, houseY + houseH*0.24);
      ctx.lineTo(houseX + houseW*0.32, houseY);
      ctx.lineTo(houseX + houseW*0.66, houseY + houseH*0.18);
      ctx.lineTo(houseX + houseW*0.04, houseY + houseH*0.32);
      ctx.closePath();
      ctx.fill();

      // windows & doors
      function windowRect(x,y,w0,h0){
        ctx.fillStyle = '#f7fbff';
        ctx.fillRect(x,y,w0,h0);
        ctx.fillStyle = 'rgba(152,190,214,.55)';
        ctx.fillRect(x+5,y+5,w0-10,h0-10);
        ctx.strokeStyle = 'rgba(81,90,99,.45)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x,y,w0,h0);
        ctx.beginPath(); ctx.moveTo(x+w0/2,y); ctx.lineTo(x+w0/2,y+h0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x,y+h0/2); ctx.lineTo(x+w0,y+h0/2); ctx.stroke();
      }
      windowRect(houseX + houseW*0.06, houseY + houseH*0.36, houseW*0.12, houseH*0.24);
      windowRect(houseX + houseW*0.32, houseY + houseH*0.34, houseW*0.12, houseH*0.26);
      windowRect(houseX + houseW*0.68, houseY + houseH*0.44, houseW*0.09, houseH*0.20);
      windowRect(houseX + houseW*0.80, houseY + houseH*0.44, houseW*0.09, houseH*0.20);

      // patio sliders behind veranda
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(houseX + houseW*0.18, houseY + houseH*0.58, houseW*0.36, houseH*0.36);
      ctx.fillStyle = 'rgba(160,197,219,.55)';
      ctx.fillRect(houseX + houseW*0.19, houseY + houseH*0.59, houseW*0.34, houseH*0.34);
      ctx.strokeStyle = 'rgba(81,90,99,.38)';
      ctx.lineWidth = 4;
      const sx = houseX + houseW*0.19, sy = houseY + houseH*0.59, sw = houseW*0.34, sh = houseH*0.34;
      ctx.strokeRect(sx,sy,sw,sh);
      for(let i=1;i<4;i++){ ctx.beginPath(); ctx.moveTo(sx + sw*i/4, sy); ctx.lineTo(sx + sw*i/4, sy+sh); ctx.stroke(); }

      // shrubs
      for(const [x,y,r,c] of [
        [houseX + houseW*0.17, houseY + houseH*0.98, 18, '#7c9d5c'],
        [houseX + houseW*0.23, houseY + houseH*0.98, 21, '#89a964'],
        [houseX + houseW*0.76, houseY + houseH*0.98, 16, '#6d9250']
      ]){
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      }

      // better positioned trees
      function drawTree(tx, baseY, scale=1){
        ctx.save();
        ctx.translate(tx, baseY);
        ctx.scale(scale, scale);
        ctx.fillStyle = 'rgba(0,0,0,.05)';
        ctx.beginPath(); ctx.ellipse(0, 8, 72, 18, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#73553f';
        ctx.fillRect(-6,-88,12,96);
        ctx.strokeStyle = '#73553f';
        ctx.lineWidth = 5;
        [[0,-86,-28,-128],[0,-72,30,-118],[-4,-58,-34,-88],[4,-52,36,-82]].forEach(([x1,y1,x2,y2])=>{ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); });
        for(const [x,y,r,c] of [
          [-30,-138,34,'#93ae73'],[6,-148,38,'#9db77b'],[40,-128,32,'#89a467'],
          [-48,-112,28,'#86a060'],[-8,-116,34,'#90aa6b'],[32,-102,28,'#7f995d']
        ]){
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
      }
      drawTree(w*0.06, h*0.62, 0.92);
      drawTree(w*0.88, h*0.64, 1.02);

      // Veranda scene
      const model = buildModel();
      const raw = model.bbox.map(p => project(p, state.yaw, state.pitch, 8.8));
      const minX=Math.min(...raw.map(p=>p.x)), maxX=Math.max(...raw.map(p=>p.x));
      const minY=Math.min(...raw.map(p=>p.y)), maxY=Math.max(...raw.map(p=>p.y));
      const scale = Math.min((w*0.52)/(maxX-minX), (h*0.44)/(maxY-minY)) * state.zoom;
      const cx = w*0.48;
      const cy = h*0.80;
      const screen = p => { const q = project(p, state.yaw, state.pitch, 8.8); return {x:cx + q.x*scale, y:cy - q.y*scale, z:q.z}; };

      const items = [];
      model.faces.forEach(face => {
        const pts = face.pts.map(screen);
        const depth = face.pts.reduce((s,p)=>s + project(p, state.yaw, state.pitch, 8.8).z, 0) / face.pts.length;
        items.push({kind:'face', pts, face, depth});
      });
      model.beams.forEach(beam => {
        const a = screen(beam.a), b = screen(beam.b);
        const depth = (a.z+b.z)/2;
        items.push({kind:'beam', a,b,beam, depth});
      });
      model.lights.forEach(light => {
        const p = screen(light.center);
        items.push({kind:'light', p, light, depth:p.z});
      });
      items.sort((a,b)=> b.depth - a.depth);

      // model shadow
      ctx.fillStyle='rgba(0,0,0,.10)';
      ctx.beginPath(); ctx.ellipse(cx, cy+18, Math.max(90, scale*(maxX-minX)*0.38), Math.max(18, scale*0.10), 0, 0, Math.PI*2); ctx.fill();

      items.forEach(item => {
        if(item.kind === 'face'){
          const {face, pts} = item;
          drawFace(pts, face.fill, face.stroke, face.line);
          if(face.kind === 'glass'){
            const p0=pts[0], p1=pts[1], p2=pts[2], p3=pts[3] || pts[2];
            ctx.save();
            ctx.beginPath(); pts.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.clip();
            const grad = ctx.createLinearGradient(p0.x,p0.y,p2.x,p2.y);
            grad.addColorStop(0,'rgba(255,255,255,.24)');
            grad.addColorStop(.5,'rgba(255,255,255,.05)');
            grad.addColorStop(1,'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(lerp(p0.x,p1.x,.16), lerp(p0.y,p1.y,.16));
            ctx.lineTo(lerp(p0.x,p1.x,.36), lerp(p0.y,p1.y,.36));
            ctx.lineTo(lerp(p3.x,p2.x,.50), lerp(p3.y,p2.y,.50));
            ctx.lineTo(lerp(p3.x,p2.x,.30), lerp(p3.y,p2.y,.30));
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        } else if(item.kind === 'beam'){
          const widthPx = Math.max(4, Math.min(18, item.beam.w * scale * 0.22));
          const poly = beamPoly(item.a,item.b,widthPx);
          drawFace(poly, item.beam.col, 'rgba(0,0,0,.10)', .8);
          const hi = beamPoly({x:lerp(item.a.x,item.b.x,.02),y:lerp(item.a.y,item.b.y,.02)}, {x:lerp(item.a.x,item.b.x,.98),y:lerp(item.a.y,item.b.y,.98)}, widthPx*0.30);
          drawFace(hi, rgba('#ffffff', .18), null, 0);
        } else {
          const p=item.p;
          ctx.beginPath();
          ctx.fillStyle='rgba(255,214,145,.18)';
          ctx.ellipse(p.x,p.y,14,8,0,0,Math.PI*2); ctx.fill();
          ctx.beginPath();
          ctx.fillStyle=item.light.glow;
          ctx.ellipse(p.x,p.y,7,4,0,0,Math.PI*2); ctx.fill();
        }
      });
    }

    canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.classList.add('dragging'); canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if(!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      state.yaw += dx * 0.009;
      state.pitch = clamp(state.pitch + dy * 0.006, 0.20, 0.72);
      render();
    });
    ['pointerup','pointercancel','pointerleave'].forEach(type => canvas.addEventListener(type, ()=>{ dragging = false; canvas.classList.remove('dragging'); }));
    canvas.addEventListener('wheel', e => { e.preventDefault(); state.zoom = clamp(state.zoom * (e.deltaY > 0 ? 0.94 : 1.08), 0.58, 1.12); render(); }, {passive:false});
    window.addEventListener('resize', render);

    openFullscreenBtn.addEventListener('click', async () => {
      try {
        if(document.fullscreenElement) await document.exitFullscreen();
        else if(fullscreenTarget.requestFullscreen) await fullscreenTarget.requestFullscreen();
      } catch (err) { console.error(err); }
    });
    sendInquiryBtn.addEventListener('click', () => { window.location.href = '../get-a-quote/index.html'; });

    makeColorSwatches();
    makeRoofCards();
    makeSideCards();
    updateUi();
    render();
  })();