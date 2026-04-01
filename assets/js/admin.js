
(function(){
  if(document.body.dataset.skipPowerPrompt !== 'true') return;
  const allowed = sessionStorage.getItem('hawkPowerAccess') === 'granted';
  if(allowed) return;
  const pass = window.prompt('Enter password');
  if(pass === '316931'){
    sessionStorage.setItem('hawkPowerAccess','granted');
  } else {
    window.location.href = '../';
  }
})();
