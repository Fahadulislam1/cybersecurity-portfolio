/* ============================================
   script.js — HackerBD Portfolio
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // 1. LOADER
  // ============================================
  const loader = document.getElementById('loader');
  const bootLines = document.querySelectorAll('.loader-line');

  const hideDelay = 2600;

  if (bootLines.length) {
    const onFinish = () => {
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
      }, 150);
    };

    let startTime = performance.now();
    const checkAnimations = () => {
      if (performance.now() - startTime >= hideDelay) {
        onFinish();
      } else {
        requestAnimationFrame(checkAnimations);
      }
    };

    setTimeout(checkAnimations, hideDelay - 150);
  }

  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    document.body.style.overflow = '';
  }, hideDelay + 150);

  // ============================================
  // 2. THREE.JS — 3D BACKGROUND
  // ============================================
  function initThree() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // -- Particles --
    const particleCount = 2500;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 40;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00ff41,
      size: 0.045,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // -- Matrix characters --
    const charCount = 1200;
    const charPositions = new Float32Array(charCount * 3);
    const charSpeeds = new Float32Array(charCount);
    for (let i = 0; i < charCount; i++) {
      charPositions[i * 3] = (Math.random() - 0.5) * 80;
      charPositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      charPositions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10;
      charSpeeds[i] = 0.004 + Math.random() * 0.018;
    }
    const charGeo = new THREE.BufferGeometry();
    charGeo.setAttribute('position', new THREE.BufferAttribute(charPositions, 3));

    // Canvas texture for katakana/ASCII chars
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 256;
    texCanvas.height = 64;
    const tCtx = texCanvas.getContext('2d');
    tCtx.fillStyle = '#00ff41';
    tCtx.font = 'bold 28px monospace';
    tCtx.textAlign = 'center';
    tCtx.textBaseline = 'middle';
    const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
    tCtx.fillText(glyphs, 128, 32);

    const spriteTexture = new THREE.CanvasTexture(texCanvas);
    const charMat = new THREE.PointsMaterial({
      map: spriteTexture,
      color: 0x00ff41,
      size: 0.3,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const charPoints = new THREE.Points(charGeo, charMat);
    scene.add(charPoints);

    camera.position.z = 14;

    // -- Mouse tracking (throttled) --
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    const handleMove = (cx, cy) => {
      targetX = (cx / window.innerWidth) * 2 - 1;
      targetY = -(cy / window.innerHeight) * 2 + 1;
    };

    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      const t = e.touches[0];
      if (t) handleMove(t.clientX, t.clientY);
    };

    // Use passive listeners + throttle via rAF
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });

    // -- Resize handler (debounced) --
    let resizeTimeout;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 150);
    };
    window.addEventListener('resize', onResize, { passive: true });

    // -- Animation loop --
    function animate() {
      requestAnimationFrame(animate);

      // Smooth camera follow
      mouseX += (targetX * 2 - mouseX) * 0.025;
      mouseY += (targetY * 1.5 - mouseY) * 0.025;
      camera.position.x += (mouseX - camera.position.x) * 0.015;
      camera.position.y += (mouseY - camera.position.y) * 0.015;
      camera.lookAt(scene.position);

      // Rotate particles
      particles.rotation.x += 0.00015;
      particles.rotation.y += 0.00025;

      // Fall matrix chars
      const pos = charPoints.geometry.attributes.position.array;
      for (let i = 0; i < charCount; i++) {
        pos[i * 3 + 1] -= charSpeeds[i];
        if (pos[i * 3 + 1] < -30) {
          pos[i * 3 + 1] = 30;
          pos[i * 3] = (Math.random() - 0.5) * 80;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10;
        }
      }
      charPoints.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    animate();

    // Return cleanup function
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }

  const cleanupThree = initThree();

  // ============================================
  // 3. NAVIGATION
  // ============================================
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const navAnchors = document.querySelectorAll('.nav-link');

  // Sticky nav background on scroll
  let ticking = false;
  const onNavScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  };
  window.addEventListener('scroll', onNavScroll, { passive: true });

  // Mobile toggle
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });

  // Close mobile nav on link click
  navAnchors.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Active link highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  const onActiveScroll = () => {
    let current = '';
    const scrollPos = window.scrollY + 120;
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        current = sec.getAttribute('id');
      }
    });
    navAnchors.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  };
  window.addEventListener('scroll', onActiveScroll, { passive: true });

  // ============================================
  // 4. SCROLL REVEAL (IntersectionObserver)
  // ============================================
  const revealElements = document.querySelectorAll('.reveal, .reveal-text');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback: show everything immediately
    revealElements.forEach((el) => el.classList.add('show'));
  }

  // ============================================
  // 5. HERO ANIMATIONS
  // ============================================
  const heroTerminal = document.getElementById('heroTerminal');
  const heroNameLarge = document.getElementById('heroNameLarge');
  const heroTyping = document.getElementById('heroTyping');
  const heroTypingCursor = document.getElementById('heroTypingCursor');
  const heroDesc = document.getElementById('heroDesc');
  const heroBadge = document.getElementById('heroBadge');
  const heroActions = document.getElementById('heroActions');
  const heroSocials = document.getElementById('heroSocials');
  const scrollIndicator = document.getElementById('scrollIndicator');

  const roles = [
    'Cybersecurity Specialist',
    'Ethical Hacker',
    'Penetration Tester',
    'Bug Bounty Hunter',
    'Security Researcher',
  ];

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeTimeout;

  function typeRole() {
    if (!heroTyping) return;
    const current = roles[roleIndex];

    if (isDeleting) {
      heroTyping.textContent = current.substring(0, charIndex - 1);
      charIndex--;
    } else {
      heroTyping.textContent = current.substring(0, charIndex + 1);
      charIndex++;
    }

    if (!isDeleting && charIndex === current.length) {
      isDeleting = true;
      typeTimeout = setTimeout(typeRole, 1800);
      return;
    }

    if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      typeTimeout = setTimeout(typeRole, 400);
      return;
    }

    const speed = isDeleting ? 30 + Math.random() * 25 : 50 + Math.random() * 40;
    typeTimeout = setTimeout(typeRole, speed);
  }

  function startHeroSequence() {
    const promptText = 'root@hackerbd:~$';
    let pIdx = 0;

    function typePrompt() {
      if (pIdx < promptText.length) {
        heroTerminal.textContent = promptText.substring(0, pIdx + 1);
        pIdx++;
        setTimeout(typePrompt, 45 + Math.random() * 25);
      } else {
        const cursorSpan = document.createElement('span');
        cursorSpan.className = 'term-cursor';
        heroTerminal.appendChild(cursorSpan);

        setTimeout(() => {
          heroNameLarge.classList.add('show');

          setTimeout(() => {
            const tw = document.querySelector('.hero-typing-wrapper');
            if (tw) tw.classList.add('show');
            setTimeout(() => typeRole(), 500);

            setTimeout(() => { heroDesc.classList.add('show'); }, 300);

            setTimeout(() => {
              if (heroBadge) heroBadge.classList.add('show');
            }, 600);

            setTimeout(() => {
              heroActions.classList.add('show');
            }, 1000);

            setTimeout(() => {
              if (heroSocials) heroSocials.classList.add('show');
            }, 1300);

            setTimeout(() => {
              scrollIndicator.classList.add('show');
            }, 1600);

          }, 350);
        }, 250);
      }
    }

    setTimeout(typePrompt, 350);
  }

  const checkLoaderDone = setInterval(() => {
    if (loader && loader.classList.contains('hidden')) {
      clearInterval(checkLoaderDone);
      startHeroSequence();
    }
  }, 100);
  setTimeout(() => {
    clearInterval(checkLoaderDone);
    if (loader && !loader.classList.contains('hidden')) {
      loader.classList.add('hidden');
      document.body.style.overflow = '';
      startHeroSequence();
    }
  }, 5000);

  // ============================================
  // 6. MAGNETIC BUTTON EFFECT
  // ============================================
  const magneticBtns = document.querySelectorAll('.btn');

  magneticBtns.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const strength = 8;
      btn.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });

  // ============================================
  // 7. HERO FLOATING PARTICLES
  // ============================================
  const heroSection = document.querySelector('.hero-section');
  if (heroSection) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'hero-particle';
      const size = 1.5 + Math.random() * 2.5;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.bottom = '-10px';
      p.style.animationDuration = (8 + Math.random() * 14) + 's';
      p.style.animationDelay = (Math.random() * 12) + 's';
      heroSection.appendChild(p);
    }
  }

  // ============================================
  // 8. CONTACT COPY TO CLIPBOARD
  // ============================================
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.cc-copy');
    if (!btn) return;
    const text = btn.getAttribute('data-copy');
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showCopied(btn);
      }).catch(() => {
        fallbackCopy(text, btn);
      });
    } else {
      fallbackCopy(text, btn);
    }
  });

  function fallbackCopy(text, btn) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showCopied(btn);
    } catch (_) {}
    document.body.removeChild(ta);
  }

  function showCopied(btn) {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    clearTimeout(btn._copyTimer);
    btn._copyTimer = setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('copied');
    }, 1800);
  }

  // ============================================
  // 9. BACK TO TOP
  // ============================================
  const bttBtn = document.getElementById('bttBtn');
  const bttSection = document.getElementById('backToTop');

  if (bttBtn) {
    bttBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Show/hide back to top (already has reveal class, but add a threshold)
  if (bttSection) {
    const bttObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          bttSection.classList.add('show');
          bttObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    bttObserver.observe(bttSection);
  }

  // ============================================
  // 10. FOOTER BACK TO TOP
  // ============================================
  const footerBtt = document.getElementById('footerBtt');
  if (footerBtt) {
    footerBtt.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============================================
  // 11. PERFORMANCE: disable animations when hidden
  // ============================================
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Optionally pause heavy work
    }
  });

  console.log('%c HackerBD Portfolio ', 'background: #0a0a0a; color: #00ff41; font-size: 1.2rem; padding: 8px 16px; border: 1px solid #00ff41;');
  console.log('%c > System online. Ready for action.', 'color: #008a22; font-style: italic;');

})();
