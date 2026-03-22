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

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem('scrollPos', window.scrollY);
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

  const form = document.getElementById('contact-form');
  if (form) {
    const status = document.getElementById('form-status');
    const btn    = document.getElementById('form-btn');
    const lang   = document.documentElement.lang;
    const isPT   = lang === 'pt-BR';

    const strings = {
      sending: isPT ? 'Enviando...'                                             : 'Sending...',
      success: isPT ? 'Mensagem enviada! Entrarei em contato em breve.'         : "Message sent! I'll get back to you soon.",
      error:   isPT ? 'Algo deu errado. Tente me enviar um email diretamente.'  : 'Something went wrong. Try emailing me directly.',
      reset:   isPT ? 'Enviar mensagem →'                                       : 'Send message →',
      invalid: isPT ? 'Digite um email válido.'                                 : 'Please enter a valid email address.',
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(form.email.value)) {
        status.textContent   = strings.invalid;
        status.style.color   = '#f55';
        status.style.display = 'block';
        return;
      }

      btn.disabled    = true;
      btn.textContent = strings.sending;

      const res = await fetch('https://formspree.io/f/xnjgdnwy', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        status.textContent = strings.success;
        status.style.color = 'var(--color-accent, #0f0)';
        form.reset();
      } else {
        status.textContent = strings.error;
        status.style.color = '#f55';
      }

      status.style.display = 'block';
      btn.disabled         = false;
      btn.textContent      = strings.reset;
    });
  }
});