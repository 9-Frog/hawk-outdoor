
(function(){
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const navMain = document.querySelector('[data-nav-main]');
  if(menuToggle && navMain){
    menuToggle.addEventListener('click', ()=> navMain.classList.toggle('open'));
  }

  document.querySelectorAll('.drop > .drop-toggle').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      if(window.innerWidth > 880) return;
      e.preventDefault();
      btn.parentElement.classList.toggle('open');
    });
  });

  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, {threshold:.14});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

  const baFrame = document.querySelector('[data-before-after]');
  if(baFrame){
    const range = baFrame.querySelector('input[type="range"]');
    const frame = baFrame.querySelector('.ba-frame');
    const afterWrap = baFrame.querySelector('.ba-after-wrap');
    const handle = baFrame.querySelector('.ba-handle');
    const apply = ()=>{
      const value = Number(range.value);
      const v = value + '%';
      afterWrap.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
      handle.style.left = v;
    };
    const setFromClientX = (clientX)=>{
      const rect = frame.getBoundingClientRect();
      const raw = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(0, Math.min(100, raw));
      range.value = clamped;
      apply();
    };
    let dragging = false;
    const start = (e)=>{
      dragging = true;
      setFromClientX(e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0);
    };
    const move = (e)=>{
      if(!dragging) return;
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
      if(typeof clientX !== 'number') return;
      setFromClientX(clientX);
    };
    const end = ()=> dragging = false;
    range.addEventListener('input', apply);
    [frame, handle].forEach(el=>{
      el.addEventListener('pointerdown', start);
      el.addEventListener('touchstart', start, {passive:true});
    });
    window.addEventListener('pointermove', move);
    window.addEventListener('touchmove', move, {passive:true});
    window.addEventListener('pointerup', end);
    window.addEventListener('touchend', end, {passive:true});
    apply();
  }

  const icons = {
    facebook:'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 8H16V4.5h-2.9C9.9 4.5 8.6 6.4 8.6 9v2H6v3.5h2.6V22H12v-7.5h3.3L15.8 11H12V9.4c0-.9.4-1.4 1.5-1.4Z"/></svg>',
    instagram:'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.4A2.6 2.6 0 0 0 4.4 7v10A2.6 2.6 0 0 0 7 19.6h10a2.6 2.6 0 0 0 2.6-2.6V7A2.6 2.6 0 0 0 17 4.4H7Zm10.7 1.8a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2.3A2.7 2.7 0 1 0 12 14.7 2.7 2.7 0 0 0 12 9.3Z"/></svg>',
    tiktok:'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.6 2c.3 2.2 1.7 4 3.8 4.7v3a8 8 0 0 1-3.8-1.1v6.4a5.8 5.8 0 1 1-5.8-5.8c.4 0 .9 0 1.3.1v3.1c-.4-.1-.8-.2-1.3-.2a2.7 2.7 0 1 0 2.7 2.7V2h3.1Z"/></svg>'
  };
  document.querySelectorAll('[data-social-icon]').forEach(el => {
    const name = el.getAttribute('data-social-icon');
    el.innerHTML = icons[name] || '';
  });

  function setPowerAccess(){
    sessionStorage.setItem('hawkPowerAccess','granted');
  }
  document.querySelectorAll('.powered-link').forEach(link => {
    link.addEventListener('click', function(e){
      if(document.body.dataset.skipPowerPrompt === 'true') return;
      e.preventDefault();
      const pass = window.prompt('Password required');
      if(pass === '316931'){
        setPowerAccess();
        window.location.href = link.getAttribute('href');
      } else if(pass !== null){
        window.alert('Incorrect password.');
      }
    });
  });
})();
