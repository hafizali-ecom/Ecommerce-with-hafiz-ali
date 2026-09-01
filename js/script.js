// =========================================================
// hafiz Ali - shared front-end behaviour
// =========================================================

const PAGE_LOAD_START = Date.now();
const MIN_PRELOADER_MS = 3000; // preloader must stay visible at least this long on every page

document.addEventListener('DOMContentLoaded', function () {

  /* ---- Fade the page in once DOM is ready (preloader still covers it) ---- */
  document.body.classList.add('page-ready');

  /* ---- Duplicate ticker content for seamless loop ---- */
  const track = document.querySelector('.ticker-track');
  if (track) {
    track.innerHTML += track.innerHTML;
  }

  /* ---- Split-text word animation (slow, staggered) ---- */
  document.querySelectorAll('.split-text').forEach(function (el) {
    const text = el.textContent;
    const words = text.split(/\s+/).filter(Boolean);
    el.innerHTML = '';
    words.forEach(function (word, i) {
      const span = document.createElement('span');
      span.className = 'split-word';
      span.textContent = word;
      span.style.animationDelay = (0.15 + i * 0.09) + 's';
      el.appendChild(span);
      el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---- Scroll-reveal animations ---- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right');
  if (revealEls.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, idx) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const group = el.getAttribute('data-reveal-group');
          const delay = el.getAttribute('data-reveal-delay') || 0;
          el.style.transitionDelay = delay + 's';
          el.classList.add('in-view');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* Auto-stagger reveal delay within a row/grid */
  document.querySelectorAll('[data-reveal-row]').forEach(function (row) {
    Array.from(row.children).forEach(function (child, i) {
      const target = child.querySelector('.reveal, .reveal-scale, .reveal-left, .reveal-right') || child;
      if (target.classList.contains('reveal') || target.classList.contains('reveal-scale') ||
          target.classList.contains('reveal-left') || target.classList.contains('reveal-right')) {
        target.setAttribute('data-reveal-delay', (i * 0.12).toFixed(2));
      }
    });
  });

  /* ---- Animated stat counters (data-count="1200") ---- */
  const counters = document.querySelectorAll('[data-count]');
  const runCounter = (el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals')) : 0;
    let start = 0;
    const duration = 1300;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = start + (target - start) * (1 - Math.pow(1 - progress, 3));
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };
  if (counters.length) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((c) => io2.observe(c));
  }

  /* ---- Mobile popup menu: fully custom, no Bootstrap dependency ----
     Opens as a centered card (not a top/side drawer) with its own
     close (X) button, backdrop click, Escape key, and link-click close. */
  const navToggleBtn = document.getElementById('navToggleBtn');
  const navCloseBtn = document.getElementById('navCloseBtn');
  const mpNav = document.getElementById('mpNav');
  const navBackdrop = document.getElementById('navBackdrop');

  function openMobileNav() {
    if (!mpNav) return;
    mpNav.classList.add('show');
    if (navBackdrop) navBackdrop.classList.add('show');
    if (navToggleBtn) navToggleBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden'; // lock background scroll
  }
  function closeMobileNav() {
    if (!mpNav) return;
    mpNav.classList.remove('show');
    if (navBackdrop) navBackdrop.classList.remove('show');
    if (navToggleBtn) navToggleBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  }
  if (navToggleBtn && mpNav) {
    navToggleBtn.addEventListener('click', function () {
      mpNav.classList.contains('show') ? closeMobileNav() : openMobileNav();
    });
  }
  if (navCloseBtn) navCloseBtn.addEventListener('click', closeMobileNav);
  if (navBackdrop) navBackdrop.addEventListener('click', closeMobileNav);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobileNav();
  });
  if (mpNav) {
    mpNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileNav);
    });
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 992) closeMobileNav();
  });

  /* ---- Smooth page-to-page transition for internal links ---- */
  document.querySelectorAll('a[href]').forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href) return;
    if (link.target === '_blank') return;
    if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      document.body.classList.remove('page-ready');
      document.body.classList.add('page-leaving');
      setTimeout(function () { window.location.href = href; }, 320);
    });
  });

  /* ---- Contact form: build a real WhatsApp message from the fields
     and open it — this used to just show a fake "sent" message without
     actually contacting WhatsApp, which was misleading. ---- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = document.getElementById('cf-name').value.trim();
      const phone = document.getElementById('cf-phone').value.trim();
      const marketplace = document.getElementById('cf-marketplace').value;
      const interest = document.getElementById('cf-interest').value;
      const message = document.getElementById('cf-message').value.trim();

      const lines = [
        `Hi hafiz, my name is ${name}.`,
        `WhatsApp number: ${phone}`,
        `Marketplace: ${marketplace}`,
        `Interested in: ${interest}`,
        `Message: ${message}`
      ];
      const waUrl = 'https://wa.me/923296527932?text=' + encodeURIComponent(lines.join('\n'));

      document.getElementById('formSuccess').classList.remove('d-none');
      window.open(waUrl, '_blank', 'noopener');
      contactForm.reset();
    });
  }

  /* ---- LLC state selector ---- */
  const llcStateSelect = document.getElementById('llcStateSelect');
  if (llcStateSelect) {
    const llcStates = {
      Texas: { label: 'Texas LLC', price: '$500' },
      Montana: { label: 'Montana LLC', price: '$350' },
      Florida: { label: 'Florida LLC', price: '$350' }
    };
    const stateName = document.getElementById('llcStateName');
    const statePrice = document.getElementById('llcStatePrice');
    const stateLink = document.getElementById('llcWhatsAppLink');

    function updateLlcState() {
      const selected = llcStates[llcStateSelect.value] || llcStates.Texas;
      if (stateName) stateName.textContent = selected.label;
      if (statePrice) statePrice.textContent = selected.price;
      if (stateLink) {
        const message = `Hi hafiz, I'd like to create a ${selected.label} for ${selected.price}. Please share the complete process.`;
        stateLink.href = 'https://wa.me/923296527932?text=' + encodeURIComponent(message);
      }
    }

    llcStateSelect.addEventListener('change', updateLlcState);
    updateLlcState();
  }

});

/* ---- Preloader: hide only once everything has loaded AND at least
   MIN_PRELOADER_MS has passed, so it never flashes by too quickly ---- */
window.addEventListener('load', function () {
  const pre = document.getElementById('preloader');
  if (!pre) return;
  const elapsed = Date.now() - PAGE_LOAD_START;
  const remaining = Math.max(MIN_PRELOADER_MS - elapsed, 0);
  setTimeout(function () {
    pre.classList.add('hide');
    setTimeout(function () { pre.remove(); }, 550);
  }, remaining);
});

/* ---- Fallback: if a page is restored from bfcache (back/forward), always show it ---- */
window.addEventListener('pageshow', function (e) {
  if (e.persisted) {
    document.body.classList.remove('page-leaving');
    document.body.classList.add('page-ready');
    const pre = document.getElementById('preloader');
    if (pre) pre.remove();
  }
});
