/* ============================================================
   DUFL — Main Module v2
   Theme, Nav, Page Transitions, Reveal, Counters, Charts, Map, Films
   ============================================================ */
(function(){
  'use strict';

  /* ===== Theme ===== */
  function initTheme(){
    const html = document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme:dark)').matches)){
      html.setAttribute('data-theme','dark');
    }
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: next } }));
      if (typeof Chart !== 'undefined'){ Object.keys(Chart.instances || {}).forEach(id => Chart.instances[id]?.destroy()); initCharts(); }
    });
  }

  /* ===== Nav ===== */
  function initNav(){
    const nav = document.getElementById('nav');
    if (!nav) return;
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 50);
      // Highlight current section for anchor links
      if (y > lastScroll + 50 || y < lastScroll - 50){
        lastScroll = y;
        highlightNavSection();
      }
    }, { passive: true });

    // Mobile menu
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks){
      menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        menuBtn.classList.toggle('open'); // animate hamburger → X
      });
      navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuBtn.classList.remove('open');
      }));
    }

    // Active page marker
    markActivePage();
  }

  function highlightNavSection(){
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('#nav .nav-links a[href^="#"]');
    if (!sections.length || !links.length) return;
    let cur = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) cur = s.id; });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
  }

  function markActivePage(){
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#nav .nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html') || (path === '/' && href === 'index.html')){
        a.classList.add('active');
      }
    });
  }

  /* ===== Page Transitions ===== */
  function initPageTransitions(){
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') ||
          href.startsWith('mailto:') || href.startsWith('tel:') ||
          href.startsWith('http://') || href.startsWith('https://')) return;
      if (!href.endsWith('.html')) return;

      link.addEventListener('click', function(e){
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        const overlay = document.createElement('div');
        overlay.className = 'page-transition';
        document.body.appendChild(overlay);
        void overlay.offsetWidth;
        overlay.classList.add('active');
        setTimeout(() => { window.location.href = href; }, 250);
      });
    });
  }

  /* ===== Scroll Reveal ===== */
  function initReveal(){
    // Immediately show all reveal elements that are in viewport
    const showAll = () => {
      document.querySelectorAll('.reveal').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100) el.classList.add('visible');
      });
    };
    // Show visible ones immediately
    setTimeout(showAll, 150);
    // Then use IntersectionObserver for the rest
    if (!('IntersectionObserver' in window)) { showAll(); return; }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  /* ===== Counters ===== */
  function initCounters(){
    if (!('IntersectionObserver' in window)) return;
    document.querySelectorAll('.counter').forEach(el => {
      const target = parseFloat(el.getAttribute('data-target'));
      const suffix = el.getAttribute('data-suffix') || '';
      const decimals = parseInt(el.getAttribute('data-decimals')) || 0;
      if (isNaN(target)) return;
      let done = false;
      new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (e.isIntersecting && !done){ done = true; obs.unobserve(el); animateCounter(el, target, suffix, decimals); }
        });
      }, { threshold: 0.4 }).observe(el);
    });
  }

  function animateCounter(el, target, suffix, decimals){
    const duration = 2200, start = performance.now();
    function frame(now){
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      const val = target * eased;
      el.textContent = (decimals > 0 ? val.toFixed(decimals) : Math.round(val)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = (decimals > 0 ? target.toFixed(decimals) : target) + suffix;
    }
    requestAnimationFrame(frame);
  }

  /* ===== Charts ===== */
  function initCharts(){
    if (typeof Chart === 'undefined') return;
    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#c44536';
    const gold = style.getPropertyValue('--gold').trim() || '#d4a853';
    const grey = style.getPropertyValue('--text-2').trim() || '#8a7b6b';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const grid = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)';

    const c1 = document.getElementById('chartBO');
    if (c1) new Chart(c1, { type:'line', data:{
      labels: ['4/27','5/9','5/16','5/24','5/31','6/19','6月'],
      datasets:[{ label:'累计(亿)', data:[0.1,1,4,10,14,18,19],
        borderColor:accent, backgroundColor:accent+'18', borderWidth:3, fill:true, tension:.35,
        pointRadius:5, pointBackgroundColor:accent, pointBorderColor:'#fff', pointBorderWidth:2, pointHoverRadius:8 }]
    }, options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>c.raw+' 亿元'}} },
      scales:{ x:{ grid:{color:grid}, ticks:{color:grey,font:{size:10}} },
               y:{ grid:{color:grid}, ticks:{color:grey,callback:v=>v+'亿'}, beginAtZero:true } },
      interaction:{ intersect:false, mode:'index' }
    }});

    const c2 = document.getElementById('chartMetrics');
    if (c2) new Chart(c2, { type:'bar', data:{
      labels: ['豆瓣评分','上座率日冠','最高排片%','观影人次\n(千万)','传播\n(十亿)'],
      datasets:[{ data:[9.3,16,35.5,55.7,10],
        backgroundColor:[accent,gold,accent+'AA',gold+'99',accent+'77'], borderRadius:8, borderSkipped:false }]
    }, options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false} },
      scales:{ x:{ grid:{display:false}, ticks:{color:grey,font:{size:9}} },
               y:{ grid:{color:grid}, ticks:{color:grey}, beginAtZero:true, max:100 } }
    }});

    const c3 = document.getElementById('chartWaves');
    if (c3) new Chart(c3, { type:'bar', data:{
      labels: ['第一波 4/30','第二波 6/18','第三波 6/25','第四波 6/26','后续'],
      datasets:[{ data:[1,6,2,5,4], backgroundColor:[accent,gold,accent+'99',gold,accent+'66'], borderRadius:8, borderSkipped:false }]
    }, options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false} },
      scales:{ x:{ grid:{color:grid}, ticks:{color:grey,stepSize:2}, beginAtZero:true },
               y:{ grid:{display:false}, ticks:{color:grey,font:{size:10}} } }
    }});

    const c4 = document.getElementById('chartSentiment');
    if (c4) new Chart(c4, { type:'doughnut', data:{
      labels: ['文化认同','祖孙/乡愁','方言美感','女性互助','地域共情'],
      datasets:[{ data:[28,30,15,12,15], backgroundColor:[accent,gold,accent+'99',gold,accent+'66'],
        borderColor:isDark?'#1a1a1a':'#fff', borderWidth:2 }]
    }, options:{ responsive:true, maintainAspectRatio:false, cutout:'58%',
      plugins:{ legend:{ position:'bottom', labels:{ color:grey, font:{size:10}, padding:14, usePointStyle:true, pointStyleWidth:8 } } }
    }});
  }


  /* ===== Map (premium SVG world map · detailed continents · rich interaction) ===== */
  function initMap(){
    const el = document.getElementById('worldMap');
    if (!el) return;

    // Release data with proper lat/lng projected to 1440x720 Mercator
    // x = (lng + 180) / 360 * 1440,  y = (90 - lat) / 180 * 720
    const waveData = [
      { lng:116.4, lat:39.9, city:'北京', country:'中国内地', date:'4月30日', wave:1, bo:'累计19亿+', audiences:'5573万人次', note:'全球首映原点' },
      { lng:114.2, lat:22.3, city:'香港', country:'中国香港', date:'6月18日', wave:2, bo:'突破港币3000万', note:'潮语原声+粤语字幕' },
      { lng:113.6, lat:22.2, city:'澳门', country:'中国澳门', date:'6月18日', wave:2, note:'与香港同步上映' },
      { lng:103.8, lat:1.35, city:'新加坡', country:'新加坡', date:'6月18日', wave:2, bo:'4800张票1.5h售罄', audiences:'首周上座率93%' },
      { lng:101.7, lat:3.14, city:'吉隆坡', country:'马来西亚', date:'6月18日', wave:2, bo:'突破1500万林吉特' },
      { lng:151.2, lat:-33.9, city:'悉尼', country:'澳大利亚', date:'6月25日', wave:3, bo:'华语片年度最佳开画' },
      { lng:174.8, lat:-41.3, city:'惠灵顿', country:'新西兰', date:'6月25日', wave:3 },
      { lng:-74.0, lat:40.7, city:'纽约', country:'美国', date:'6月26日', wave:4, bo:'限定放映中' },
      { lng:-79.4, lat:43.7, city:'多伦多', country:'加拿大', date:'6月26日', wave:4 },
      { lng:-0.13, lat:51.5, city:'伦敦', country:'英国', date:'6月26日', wave:4 },
      { lng:-6.26, lat:53.4, city:'都柏林', country:'爱尔兰', date:'6月26日', wave:4 },
      { lng:139.8, lat:35.7, city:'东京', country:'日本', date:'6月26日', wave:4, note:'日文字幕版' },
      { lng:2.35, lat:48.9, city:'巴黎', country:'法国', date:'待定', wave:5, note:'洽谈中' },
      { lng:127.0, lat:37.6, city:'首尔', country:'韩国', date:'待定', wave:5, note:'洽谈中' },
      { lng:100.5, lat:13.8, city:'曼谷', country:'泰国', date:'待定', wave:5, note:'洽谈中' },
      { lng:105.8, lat:21.0, city:'河内', country:'越南', date:'待定', wave:5, note:'洽谈中' },
    ]
    .map(function(d){ return Object.assign(d, { x: ((d.lng+180)/360*1440).toFixed(1), y: ((90-d.lat)/180*720).toFixed(1) }); });

    // Detailed continent shapes (SVG paths, 1440x720 Mercator viewBox)
    function continentPaths(){
      return [
        // North America
        {d:'M68,120 L72,84 L100,56 L128,44 L160,36 L200,32 L252,36 L280,44 L304,56 L320,68 L332,88 L340,104 L344,112 L340,124 L328,136 L316,144 L304,160 L296,176 L288,192 L284,204 L280,216 L276,228 L264,248 L252,260 L240,272 L224,284 L212,296 L200,308 L188,316 L172,320 L156,316 L140,308 L128,296 L116,280 L108,264 L100,244 L92,224 L84,228 L80,240 L76,256 L72,272 L68,284 L60,272 L56,252 L52,232 L52,216 L56,200 L64,188 L68,172 L72,152 L72,136 Z', fill:'var(--map-land)'},
        // South America
        {d:'M196,340 L204,328 L220,316 L232,304 L244,296 L256,292 L264,300 L272,312 L280,328 L284,344 L288,360 L292,380 L292,400 L288,424 L284,444 L280,460 L276,476 L268,492 L260,504 L248,516 L236,520 L228,512 L220,496 L212,476 L204,456 L196,436 L188,416 L184,396 L184,376 L188,356 L192,344 Z', fill:'var(--map-land)'},
        // Europe
        {d:'M400,92 L412,80 L428,72 L448,68 L464,72 L480,80 L492,92 L504,104 L512,116 L520,128 L524,140 L524,148 L520,160 L516,172 L508,184 L500,196 L492,208 L480,220 L472,232 L464,244 L456,252 L444,260 L436,268 L424,276 L416,280 L408,276 L400,268 L396,256 L392,240 L388,224 L388,212 L392,204 L396,192 L400,180 L400,168 L400,152 L400,136 L400,120 L400,104 Z', fill:'var(--map-land)'},
        // Africa
        {d:'M412,284 L424,272 L440,260 L456,256 L472,256 L488,260 L504,268 L516,280 L528,296 L536,312 L544,332 L548,352 L552,376 L552,400 L552,424 L548,448 L544,472 L540,492 L532,512 L524,528 L512,540 L504,548 L496,552 L484,548 L476,540 L468,528 L460,512 L452,496 L444,476 L436,456 L428,436 L420,416 L416,396 L414,376 L416,356 L418,340 L420,324 L420,308 L418,296 L416,288 Z', fill:'var(--map-land)'},
        // Asia
        {d:'M544,40 L580,28 L624,20 L676,16 L724,20 L776,28 L820,44 L860,56 L896,68 L920,76 L932,88 L944,104 L956,120 L964,140 L972,160 L976,180 L980,204 L984,224 L988,248 L988,272 L988,296 L984,316 L980,336 L972,352 L960,368 L944,380 L928,388 L908,396 L884,404 L860,412 L836,420 L812,428 L788,436 L768,440 L752,444 L736,444 L720,444 L704,440 L688,436 L672,428 L656,420 L640,408 L624,396 L608,380 L592,364 L580,348 L568,332 L560,316 L556,300 L560,284 L564,268 L568,252 L568,236 L564,220 L560,208 L556,192 L552,176 L548,160 L548,144 L548,128 L548,112 L548,96 L548,80 L544,64 L544,52 Z', fill:'var(--map-land)'},
        // Southeast Asia / Indonesia / Japan / Philippines
        {d:'M892,332 L900,344 L908,356 L916,368 L920,384 L924,396 L924,408 L920,420 L912,428 L900,432 L892,428 L884,420 L880,408 L876,392 L876,376 L880,360 L884,348 L888,340 Z', fill:'var(--map-land)'},
        {d:'M876,300 L884,316 L892,332 L900,348 L908,364 L916,376 L924,384 L936,388 L940,396 L940,404 L936,412 L928,416 L920,416 L912,412 L904,404 L896,392 L888,376 L880,356 L872,336 L868,320 L868,304 Z', fill:'var(--map-land)'},
        // Japan
        {d:'M940,220 L944,232 L944,248 L940,264 L936,276 L932,288 L928,296 L924,304 L924,312 L928,316 L932,312 L936,304 L940,292 L944,280 L948,264 L948,248 L948,232 L944,220 Z', fill:'var(--map-land)'},
        // Australia
        {d:'M1016,444 L1040,436 L1068,432 L1096,432 L1124,436 L1148,444 L1168,456 L1184,468 L1196,484 L1204,500 L1208,516 L1208,532 L1204,548 L1196,560 L1184,572 L1168,580 L1148,588 L1124,592 L1096,592 L1068,588 L1040,580 L1016,568 L996,552 L980,536 L972,520 L968,500 L972,484 L980,468 L996,456 Z', fill:'var(--map-land)'},
        // New Zealand
        {d:'M1320,560 L1324,552 L1328,548 L1332,556 L1332,568 L1328,580 L1324,584 L1320,580 L1316,572 Z', fill:'var(--map-land)'},
        // Taiwan
        {d:'M992,244 L996,240 L1000,248 L1000,260 L996,272 L992,276 L988,268 L988,256 Z', fill:'var(--map-land)'},
        // Sri Lanka
        {d:'M660,384 L664,380 L668,388 L668,400 L664,408 L660,404 L656,396 Z', fill:'var(--map-land)'},
        // Madagascar
        {d:'M564,500 L568,496 L572,504 L572,520 L568,532 L564,536 L560,524 L560,508 Z', fill:'var(--map-land)'},
        // Greenland
        {d:'M260,48 L276,44 L300,40 L328,44 L344,48 L340,56 L328,64 L308,68 L284,68 L268,64 L260,56 Z', fill:'var(--map-land)'},
        // Caribbean Islands
        {d:'M228,300 L236,296 L244,300 L244,308 L236,312 L228,308 Z', fill:'var(--map-land)'},
        // PNG
        {d:'M1120,404 L1128,400 L1144,400 L1160,404 L1168,408 L1164,412 L1148,416 L1132,416 L1120,412 Z', fill:'var(--map-land)'},
      ];
    }

    // Label data
    const labels = [
      { x:'50%', y:'20%', t:'NORTH AMERICA', s:'continent' },
      { x:'21%', y:'54%', t:'SOUTH AMERICA', s:'continent' },
      { x:'35%', y:'21%', t:'EUROPE', s:'continent' },
      { x:'37%', y:'52%', t:'AFRICA', s:'continent' },
      { x:'60%', y:'25%', t:'ASIA', s:'continent' },
      { x:'76%', y:'72%', t:'AUSTRALIA', s:'continent' },
      { x:'18%', y:'45%', t:'ATLANTIC OCEAN', s:'ocean' },
      { x:'10%', y:'65%', t:'PACIFIC OCEAN', s:'ocean' },
      { x:'82%', y:'72%', t:'INDIAN OCEAN', s:'ocean' },
      { x:'70%', y:'65%', t:'SOUTH PACIFIC', s:'ocean' },
    ];

    // Wave color config
    const waveColors = {
      1:{fill:'#c44536',glow:'rgba(196,69,54,0.5)',sz:36,r:true},
      2:{fill:'#d4a853',glow:'rgba(212,168,83,0.4)',sz:28,r:false},
      3:{fill:'#e8a050',glow:'rgba(232,160,80,0.4)',sz:26,r:false},
      4:{fill:'#e8897a',glow:'rgba(232,137,122,0.35)',sz:24,r:false},
      5:{fill:'#999',glow:'rgba(153,153,153,0.3)',sz:20,r:false},
    };

    // Build continent paths SVG
    var continentPathsStr = continentPaths().map(function(p){
      return '<path d="'+p.d+'" fill="'+p.fill+'" stroke="var(--map-land-stroke)" stroke-width="1" vector-effect="non-scaling-stroke"/>';
    }).join('\n');

    // Build markers
    var markersHtml = '';
    waveData.forEach(function(d){
      var w = waveColors[d.wave];
      var pulse = w.r ? '<circle cx="'+d.x+'" cy="'+d.y+'" r="'+(w.sz*2)+'" fill="none" stroke="'+w.fill+'" stroke-width="2" opacity="0.08" class="map-pulse-ring"><animate attributeName="r" from="'+(w.sz*1.2)+'" to="'+(w.sz*3)+'" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.15" to="0" dur="3s" repeatCount="indefinite"/></circle><circle cx="'+d.x+'" cy="'+d.y+'" r="'+(w.sz*1.4)+'" fill="none" stroke="'+w.fill+'" stroke-width="1.5" opacity="0.15" class="map-pulse-ring"><animate attributeName="r" from="'+(w.sz*0.7)+'" to="'+(w.sz*2)+'" dur="3s" begin="0.8s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.2" to="0" dur="3s" begin="0.8s" repeatCount="indefinite"/></circle>' : '';

      var strokeDash = d.wave===5 ? ' stroke-dasharray="3 2"' : ' stroke-width="2.5"';

      markersHtml += '<g class="map-dot-group" data-city="'+d.city+'" data-country="'+d.country+'" data-date="'+d.date+'" data-wave="'+d.wave+'" data-bo="'+(d.bo||'')+'" data-audiences="'+(d.audiences||'')+'" data-note="'+(d.note||'')+'">'
        + pulse
        + '<circle cx="'+d.x+'" cy="'+d.y+'" r="'+(w.sz/2+4)+'" fill="'+w.fill+'" opacity="0.25" filter="url(#mapBlur)"/>'
        + '<circle cx="'+d.x+'" cy="'+d.y+'" r="'+(w.sz/2)+'" fill="'+w.fill+'" stroke="#fff"'+strokeDash+' stroke-opacity="0.9"/>'
        + '<text x="'+d.x+'" y="'+d.y+'" text-anchor="middle" dy="0.35em" fill="#fff" font-family="system-ui,-apple-system,sans-serif" font-size="'+(d.wave===1?'12':'9')+'" font-weight="700" pointer-events="none" style="text-rendering:geometricPrecision">'+d.wave+'</text>'
        + '</g>';
    });

    // Arc connections from China origin
    var originX = 1185, originY = 370;
    var arcsHtml = '';
    waveData.slice(1).forEach(function(d){
      if (d.wave >= 5) return; // skip upcoming
      var dx = parseFloat(d.x), dy = parseFloat(d.y);
      var cx = (originX + dx) / 2;
      var cy = Math.min(originY, dy) - 30 - Math.abs(dx-originX)*0.08;
      arcsHtml += '<path d="M'+originX+','+originY+' Q'+cx.toFixed(1)+','+cy.toFixed(1)+' '+d.x+','+d.y+'" fill="none" stroke="'+waveColors[d.wave].fill+'" stroke-width="0.7" opacity="0.15" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/>';
    });

    // Build complete map
    el.innerHTML = ''
    + '<div class="world-map-premium">'
    + '  <svg viewBox="0 0 1440 720" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" class="world-map-svg">'
    + '    <defs>'
    + '      <radialGradient id="oceanGrad" cx="50%" cy="50%" r="60%">'
    + '        <stop offset="0%" stop-color="var(--map-ocean-center)"/>'
    + '        <stop offset="100%" stop-color="var(--map-ocean-edge)"/>'
    + '      </radialGradient>'
    + '      <filter id="mapBlur">'
    + '        <feGaussianBlur stdDeviation="3"/>'
    + '      </filter>'
    + '      <filter id="landShadow">'
    + '        <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="var(--map-land-shadow)" flood-opacity="0.3"/>'
    + '      </filter>'
    + '    </defs>'
    // Ocean background
    + '    <rect width="1440" height="720" fill="url(#oceanGrad)"/>'
    // Graticule
    + '    <g stroke="var(--map-grid)" stroke-width="0.5" opacity="0.5">'
    + (function(){
      var lines='';
      for(var i=0;i<=1440;i+=72) lines+='<line x1="'+i+'" y1="0" x2="'+i+'" y2="720"/>';
      for(var j=0;j<=720;j+=60) lines+='<line x1="0" y1="'+j+'" x2="1440" y2="'+j+'"/>';
      return lines;
    })()
    + '    </g>'
    // Continents
    + '    <g filter="url(#landShadow)">' + continentPathsStr + '</g>'
    // Ocean labels
    + labels.filter(function(l){return l.s==='ocean';}).map(function(l){
        return '<text x="'+l.x+'" y="'+l.y+'" fill="var(--map-label)" font-family="system-ui,-apple-system,sans-serif" font-size="10" font-weight="400" letter-spacing="0.25em" text-anchor="middle" fill-opacity="0.35" transform="translate(0,0)">'+l.t+'</text>';
      }).join('')
    // Continent labels
    + labels.filter(function(l){return l.s==='continent';}).map(function(l){
        return '<text x="'+l.x+'" y="'+l.y+'" fill="var(--map-label)" font-family="system-ui,-apple-system,sans-serif" font-size="9" font-weight="500" letter-spacing="0.18em" text-anchor="middle" fill-opacity="0.3">'+l.t+'</text>';
      }).join('')
    // Arcs
    + arcsHtml
    // Markers
    + markersHtml
    + '  </svg>'
    // Tooltip overlay
    + '  <div class="map-card-tooltip" id="mapCardTooltip">'
    + '    <div class="mct-close">&times;</div>'
    + '    <div class="mct-header"></div>'
    + '    <div class="mct-body"><span class="mct-date"></span><span class="mct-bo"></span><span class="mct-aud"></span><span class="mct-note"></span></div>'
    + '    <div class="mct-wave"></div>'
    + '  </div>'
    // Wave legend
    + '  <div class="map-wave-legend">'
    + '    <span class="mwl-item"><i style="background:#c44536"></i>第1波 · 4.30</span>'
    + '    <span class="mwl-item"><i style="background:#d4a853"></i>第2波 · 6.18</span>'
    + '    <span class="mwl-item"><i style="background:#e8a050"></i>第3波 · 6.25</span>'
    + '    <span class="mwl-item"><i style="background:#e8897a"></i>第4波 · 6.26</span>'
    + '    <span class="mwl-item"><i style="background:#999"></i>待定</span>'
    + '  </div>'
    + '</div>';

    // Tooltip interaction
    var tooltip = el.querySelector('#mapCardTooltip');
    var mapContainer = el.querySelector('.world-map-premium');

    el.querySelectorAll('.map-dot-group').forEach(function(g){
      g.addEventListener('mouseenter', function(e){
        var d = this.dataset;
        var isDark = document.documentElement.getAttribute('data-theme')==='dark';
        var wc = ['','#c44536','#d4a853','#e8a050','#e8897a','#999'][parseInt(d.wave)];

        tooltip.querySelector('.mct-header').innerHTML = '<strong>'+d.city+'</strong><span>'+d.country+'</span>';
        tooltip.querySelector('.mct-date').textContent = '📅 '+d.date+' · 第'+d.wave+'波上映';
        tooltip.querySelector('.mct-bo').textContent = d.bo || '';
        tooltip.querySelector('.mct-aud').textContent = d.audiences || '';
        tooltip.querySelector('.mct-note').textContent = d.note || '';
        tooltip.querySelector('.mct-wave').textContent = '';
        tooltip.querySelector('.mct-wave').style.cssText = 'background:'+wc+';color:#fff';
        tooltip.style.borderTopColor = wc;
        tooltip.classList.add('visible');
      });
      g.addEventListener('mousemove', function(e){
        var rect = mapContainer.getBoundingClientRect();
        var tx = e.clientX - rect.left + 20;
        var ty = e.clientY - rect.top - 60;
        if (tx + 200 > rect.width) tx = tx - 220;
        if (ty < 10) ty = 10;
        tooltip.style.left = tx + 'px';
        tooltip.style.top = ty + 'px';
      });
      g.addEventListener('mouseleave', function(){
        tooltip.classList.remove('visible');
      });
    });
  }

  /* ===== Film Database (enriched · all films with verified posters) ===== */
  const FILMS = [
    { title:'给阿嬷的情书', year:2026, dialect:'闽南语(潮汕)', bo:19, rating:9.3, tags:['侨批','祖孙情','素人','现象级'], img:'assets/images/posters/IMG_9318.jpg', desc:'以潮汕方言为主要对白，融合侨批记忆与南洋华人迁徙史，从区域点映逆袭至19亿票房的现象级方言电影。全素人出演、95%潮汕话对白，被人民日报称为"一封写给世界的情书"。', director:'蓝鸿春', runtime:'128分钟', awards:'2026五一档冠军 · 豆瓣年度最高分华语剧情片' },
    { title:'繁花', year:2024, dialect:'上海话', bo:0, rating:8.7, tags:['王家卫','沪语','年代剧'], img:'assets/images/posters/IMG_9269.jpg', desc:'王家卫首部电视剧，全程沪语对白，上海九十年代市井烟火。沪语的文化质感成为作品核心魅力，将方言从"沟通工具"升华为"审美对象"。', director:'王家卫', runtime:'30集', awards:'腾讯视频年度剧王 · 38国海外发行' },
    { title:'人生大事', year:2022, dialect:'武汉话', bo:17.1, rating:7.3, tags:['殡葬','市井','亲情','治愈'], img:'assets/images/posters/IMG_9268.jpg', desc:'以武汉方言讲述殡葬师与孤儿的故事，武汉话的直爽与幽默消解了题材的沉重感。商业类型片中方言运用的标杆之作。', director:'刘江江', runtime:'112分钟', awards:'2022暑期档冠军 · 金鸡奖最佳导演处女作' },
    { title:'隐入尘烟', year:2022, dialect:'西北方言(甘肃)', bo:1.1, rating:8.4, tags:['柏林','文艺片','农村','质朴'], img:'assets/images/posters/IMG_9273.jpg', desc:'以甘肃方言呈现西北农村最朴素的生命质感，入围柏林电影节主竞赛单元。"国际电影节→海外口碑→国内二次传播"的迂回路线成为文艺片出海样本。', director:'李睿珺', runtime:'133分钟', awards:'柏林电影节主竞赛 · 亚洲电影大奖最佳影片提名' },
    { title:'爱情神话', year:2021, dialect:'上海话', bo:2.6, rating:8.1, tags:['沪语','都市','轻喜剧'], img:'assets/images/posters/IMG_9274.jpg', desc:'全沪语对白的都市轻喜剧，打破方言叙事"乡土"刻板印象，让吴侬软语与摩登都市完美共生。', director:'邵艺辉', runtime:'120分钟', awards:'金鸡奖最佳编剧 · 华语年度十佳' },
    { title:'雄狮少年', year:2021, dialect:'粤语', bo:2.5, rating:8.3, tags:['动画','醒狮','岭南'], img:'assets/images/posters/雄狮少年1.jpg', desc:'醒狮鼓点撞着地道粤音，让岭南少年的热血与乡土底色愈发醇厚。国产动画方言叙事的里程碑。', director:'孙海鹏', runtime:'104分钟', awards:'金鸡奖最佳美术片 · 法国昂西动画节入围' },
    { title:'山海情', year:2021, dialect:'西北官话(固原)', bo:0, rating:9.3, tags:['扶贫','西海固','正午阳光'], img:'assets/images/posters/山海情.jpg', desc:'以地道固原话演绎扶贫史诗，全民级爆款剧集，译介至海外多国播出。证明方言正剧完全可以走向世界。', director:'孔笙 / 孙墨龙', runtime:'23集', awards:'白玉兰奖最佳电视剧 · 飞天奖优秀电视剧' },
    { title:'无名之辈', year:2018, dialect:'西南官话(贵州)', bo:7.9, rating:8.1, tags:['喜剧','犯罪','小人物'], img:'assets/images/posters/IMG_9281.jpg', desc:'以贵州方言呈现一群"无名之辈"的荒诞一天，证明方言在商业类型片中的巨大潜力。西南官话的喜剧基因与黑色犯罪类型天然耦合。', director:'饶晓志', runtime:'108分钟', awards:'年度黑马 · 票房逆袭典范' },
    { title:'南方车站的聚会', year:2019, dialect:'武汉话', bo:2, rating:7.4, tags:['戛纳','犯罪','黑色电影'], img:'assets/images/posters/IMG_9289.jpg', desc:'刁亦男执导的黑色电影，全程武汉方言。戛纳首映后国际影评界热烈讨论"武汉味"的美学价值。', director:'刁亦男', runtime:'113分钟', awards:'戛纳电影节主竞赛 · 金马奖最佳影片提名' },
    { title:'山河故人', year:2015, dialect:'山西方言(汾阳)', bo:0.3, rating:8.0, tags:['贾樟柯','戛纳','离散'], img:'assets/images/posters/山河故人.jpg', desc:'贾樟柯以山西方言讲述跨越26年的离散故事。方言是"故乡"最具体的声景记忆。', director:'贾樟柯', runtime:'126分钟', awards:'戛纳电影节主竞赛 · 金马奖最佳原著剧本' },
    { title:'秋菊打官司', year:1992, dialect:'陕西方言', bo:0.3, rating:8.5, tags:['威尼斯金狮','张艺谋','现实主义'], img:'assets/images/posters/秋菊打官司.jpg', desc:'硬朗陕音立住西北农村的执拗坦荡，获威尼斯金狮奖，中国现实主义方言电影开山之作。', director:'张艺谋', runtime:'100分钟', awards:'威尼斯电影节金狮奖 · 巩俐获最佳女演员' },
    { title:'童年往事', year:1985, dialect:'客家话', bo:0.01, rating:8.8, tags:['侯孝贤','自传','乡愁'], img:'assets/images/posters/童年往事.jpg', desc:'侯孝贤以客家乡音铺展少年成长与家族变迁，平淡日常里藏着深沉乡愁。台湾新电影运动的经典。', director:'侯孝贤', runtime:'137分钟', awards:'金马奖最佳原著剧本 · 柏林电影节费比西奖' },
    { title:'春江水暖', year:2019, dialect:'杭州话(吴语)', bo:0.02, rating:8.2, tags:['戛纳','艺术片','家族'], img:'assets/images/posters/春江水暖.jpg', desc:'富春山水中，温软乡音娓娓道来家族四季，铺展成一幅江南烟火长卷。', director:'顾晓刚', runtime:'150分钟', awards:'戛纳电影节影评人周闭幕片 · FIRST青年电影展最佳导演' },
    { title:'海角七号', year:2008, dialect:'闽南语(台湾)', bo:1.3, rating:8.1, tags:['台湾','音乐','爱情'], img:'assets/images/posters/海角七号.jpg', desc:'恒春风裹着闽南语的温柔，一封隔世情书道尽海岛的柔软与坚守。开启台湾电影"后海角时代"。', director:'魏德圣', runtime:'129分钟', awards:'金马奖最佳影片 · 台湾影史华语片票房冠军(2008)' },
    { title:'疯狂的石头', year:2006, dialect:'重庆方言', bo:0.25, rating:8.5, tags:['黑色喜剧','宁浩','多方言'], img:'assets/images/posters/IMG_9311.jpg', desc:'爽利重庆话适配黑色喜剧节奏，开启西南官话喜剧的创作热潮。小成本方言片的商业奇迹。', director:'宁浩', runtime:'98分钟', awards:'金马奖最佳原著剧本 · 华语黑色喜剧标杆' },
    { title:'一直游到海水变蓝', year:2020, dialect:'多方言', bo:0.07, rating:7.5, tags:['纪录片','文学','乡土'], img:'assets/images/posters/IMG_9319.jpg', desc:'贾樟柯执导文学纪录片，多地方言呈现贾平凹、余华、梁鸿等作家的口述史。方言在此是文学与土地的桥梁。', director:'贾樟柯', runtime:'112分钟', awards:'柏林电影节特别展映 · 纽约电影节入围' },
    { title:'杨梅洲', year:2012, dialect:'湘语(湘潭)', bo:0.005, rating:7.6, tags:['文艺片','家庭','湖南'], img:'assets/images/posters/杨梅洲.jpg', desc:'湘潭乡音诉说普通家庭的聚散羁绊，在如水日常里藏着湖湘乡土的温润质感。', director:'陈卓', runtime:'98分钟', awards:'FIRST青年电影展最佳导演提名' },
    { title:'麦兜故事', year:2001, dialect:'粤语(香港)', bo:0.15, rating:8.9, tags:['动画','香港','童年'], img:'assets/images/posters/麦兜故事.jpg', desc:'软糯港式粤语讲尽市井细碎温暖，几代人心中最鲜活的香港记忆。方言动画的永恒经典。', director:'袁建滔', runtime:'75分钟', awards:'金马奖最佳动画长片 · 香港电影金像奖' },
  ];

  function initFilmDB(){
    const grid = document.getElementById('filmGrid');
    if (!grid) return;

    let filterDialect = 'all';
    let searchQuery = '';
    let sortBy = 'bo'; // 'bo' | 'rating' | 'year' | 'title'

    function render(){
      let films = FILMS.filter(f => {
        if (filterDialect !== 'all'){
          const map = { minnan: ['闽南'], yue: ['粤'], wu: ['上海','吴语','杭州'], guanhua: ['官话','重庆','武汉','陕西','山西','贵州','西北'], hakka: ['客家'], xiang: ['湘'] };
          if (!(map[filterDialect]?.some(k => f.dialect.includes(k)) ?? false)) return false;
        }
        if (searchQuery){
          const q = searchQuery.toLowerCase();
          const match = [f.title, f.dialect, f.desc, f.director, ...f.tags].some(s => (s||'').toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      });

      // Sort
      films.sort((a,b) => {
        if (sortBy === 'bo') return b.bo - a.bo;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'year') return b.year - a.year;
        if (sortBy === 'title') return a.title.localeCompare(b.title, 'zh');
        return 0;
      });

      if (films.length === 0){
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-3)"><span style="font-size:48px;display:block;margin-bottom:12px">🔍</span><p>没有找到匹配的电影</p><p style="font-size:12px;margin-top:4px">试试其他关键词或筛选项</p></div>';
        return;
      }

      grid.innerHTML = films.map(f => `
        <div class="film-card reveal" onclick="openFilmDetail('${f.title}')">
          <div class="film-img">
            ${f.img ? `<img src="${f.img}" alt="${f.title}" loading="lazy" onerror="this.parentElement.innerHTML='<span style=font-size:48px>🎬</span>'">` : '<span style="font-size:48px">🎬</span>'}
            <span class="dialect-tag">${f.dialect}</span>
            ${f.bo > 0 ? `<span class="bo-badge">${f.bo}亿</span>` : ''}
          </div>
          <div class="film-body">
            <h4>${f.title} <span class="film-year">${f.year}</span></h4>
            <div class="film-meta">
              <span>${f.bo > 0 ? '<span class="bo">'+f.bo+'亿</span>' : '电视剧'}</span>
              <span>豆瓣 ${f.rating}</span>
              ${f.director ? '<span class="film-director">'+f.director+'</span>' : ''}
            </div>
            <p class="film-desc">${f.desc}</p>
            <div class="film-tags">${f.tags.map(t=>'<span>'+t+'</span>').join('')}</div>
          </div>
        </div>`).join('');

      // Re-init reveal animations for new cards
      setTimeout(initReveal, 100);
    }

    // Filter buttons
    document.querySelectorAll('.film-filter-btn').forEach(btn => {
      btn.addEventListener('click', function(){
        document.querySelectorAll('.film-filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        filterDialect = this.getAttribute('data-dialect');
        render();
      });
    });

    // Search input
    const searchInput = document.getElementById('filmSearch');
    if (searchInput){
      searchInput.addEventListener('input', function(){
        searchQuery = this.value.trim();
        render();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('filmSort');
    if (sortSelect){
      sortSelect.addEventListener('change', function(){
        sortBy = this.value;
        render();
      });
    }

    render();
  }

  /* ===== Film Detail Modal ===== */
  window.openFilmDetail = function(title){
    const film = FILMS.find(f => f.title === title);
    if (!film) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'film-modal-overlay';
    overlay.onclick = function(e){ if(e.target === this) closeModal(); };

    // Format director/runtime/awards
    const metaRows = [];
    if (film.director) metaRows.push(`<div class="fm-row"><span>导演</span><span>${film.director}</span></div>`);
    if (film.runtime) metaRows.push(`<div class="fm-row"><span>时长</span><span>${film.runtime}</span></div>`);
    metaRows.push(`<div class="fm-row"><span>方言</span><span>${film.dialect}</span></div>`);
    metaRows.push(`<div class="fm-row"><span>年份</span><span>${film.year}</span></div>`);
    if (film.bo > 0) metaRows.push(`<div class="fm-row"><span>票房</span><span class="fm-bo">${film.bo} 亿</span></div>`);
    metaRows.push(`<div class="fm-row"><span>豆瓣</span><span class="fm-rating">${film.rating}</span></div>`);
    if (film.awards) metaRows.push(`<div class="fm-row"><span>荣誉</span><span>${film.awards}</span></div>`);

    overlay.innerHTML = `<div class="film-modal">
      <button class="fm-close" onclick="this.closest('.film-modal-overlay').remove();document.body.style.overflow=''">✕</button>
      <div class="fm-hero">
        <div class="fm-poster">${film.img ? `<img src="${film.img}" alt="${film.title}" onerror="this.parentElement.innerHTML='<span style=font-size:64px>🎬</span>'">` : '<span style="font-size:64px">🎬</span>'}</div>
        <div class="fm-header">
          <h2 class="serif">${film.title}</h2>
          <p class="fm-dialect">${film.dialect}</p>
          <div class="fm-tags">${film.tags.map(t=>'<span>'+t+'</span>').join('')}</div>
        </div>
      </div>
      <div class="fm-body">
        <p class="fm-desc">${film.desc}</p>
        <div class="fm-meta-grid">${metaRows.join('')}</div>
      </div>
    </div>`;

    const closeModal = function(){ overlay.remove(); document.body.style.overflow = ''; };

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Animate in
    requestAnimationFrame(() => { overlay.classList.add('open'); });

    // Close on Escape
    const escHandler = function(e){ if(e.key === 'Escape'){ closeModal(); document.removeEventListener('keydown', escHandler); }};
    document.addEventListener('keydown', escHandler);
  };

  /* ===== Back to Top ===== */
  function initBackToTop(){
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
  }

  /* ===== Hero Slideshow ===== */
  function initHeroSlideshow(){
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dots span');
    if (!slides.length) return;
    let current = 0, timer;
    function goTo(i){
      slides[current].classList.remove('active');
      if (dots.length) dots[current].classList.remove('active');
      current = ((i % slides.length) + slides.length) % slides.length;
      slides[current].classList.add('active');
      if (dots.length) dots[current].classList.add('active');
    }
    function next(){ goTo(current + 1); }
    timer = setInterval(next, 6000);
    dots.forEach((d,i) => d.addEventListener('click', ()=>{ goTo(i); clearInterval(timer); timer = setInterval(next, 6000); }));
    // Cinematic bars
    setTimeout(() => document.querySelectorAll('.hero-bar').forEach(b => b.classList.add('show')), 400);
    // Parallax
    const inner = document.getElementById('heroInner');
    if (inner && window.matchMedia('(pointer:fine)').matches){
      document.addEventListener('mousemove', e => {
        inner.style.transform = `translate(${(e.clientX/window.innerWidth-.5)*14}px,${(e.clientY/window.innerHeight-.5)*10}px)`;
      }, {passive:true});
    }
    document.addEventListener('visibilitychange', ()=>{
      if (document.hidden) clearInterval(timer);
      else timer = setInterval(next, 6000);
    });
  }

  /* ===== Init ===== */
  function init(){
    document.documentElement.classList.add('js');
    initTheme();
    initNav();
    initHeroSlideshow();
    initPageTransitions();
    initReveal();
    initCounters();
    initCharts();
    initFilmDB();
    initBackToTop();
    if (document.readyState === 'complete') initMap();
    else window.addEventListener('load', initMap);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
