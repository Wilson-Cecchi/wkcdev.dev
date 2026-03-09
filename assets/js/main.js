/* main.js — Wilson Klein Cecchi Portfolio */
const scrollPos = localStorage.getItem('scrollPos');
if (scrollPos) {
  window.addEventListener('load', () => {
    window.scrollTo(0, parseInt(scrollPos));
    localStorage.removeItem('scrollPos');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursor-ring');
  if (cursor && ring) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function animCursor() {
      cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(animCursor);
    })();
  }
  const nav = document.querySelector('nav');
  if (nav) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60));
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    revealEls.forEach(el => obs.observe(el));
  }
  document.querySelectorAll('[data-accordion]').forEach(item => {
    item.addEventListener('click', () => {
      const body = item.nextElementSibling;
      if (!body || !body.hasAttribute('data-accordion-body')) return;
      const isOpen = body.classList.contains('open');
      document.querySelectorAll('[data-accordion-body]').forEach(b => b.classList.remove('open'));
      document.querySelectorAll('[data-accordion]').forEach(i => i.classList.remove('active'));
      if (!isOpen) { body.classList.add('open'); item.classList.add('active'); }
    });
  });
  const hamburger = document.getElementById('nav-hamburger');
  const navMobile = document.getElementById('nav-mobile');
  if (hamburger && navMobile) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navMobile.classList.toggle('open');
    });
    navMobile.querySelectorAll('.nav-mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navMobile.classList.remove('open');
      });
    });
  }
});
