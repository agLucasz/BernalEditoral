/* ==========================================================================
   Bernal Editorial — interações da landing page
   ========================================================================== */

(function () {
  'use strict';

  // — Formulário de contato: alterna entre formulário e mensagem de sucesso —
  const form = document.getElementById('contact-form');
  const success = document.getElementById('contact-success');
  const resetButton = document.getElementById('contact-reset');

  if (form && success && resetButton) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      form.hidden = true;
      success.hidden = false;
      resetButton.focus();
    });

    resetButton.addEventListener('click', () => {
      form.reset();
      success.hidden = true;
      form.hidden = false;
      form.querySelector('input')?.focus();
    });
  }

  // — Destaca no menu a seção visível —
  const navLinks = document.querySelectorAll('.nav__link');
  const sections = [...navLinks]
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  // — Animação de entrada dos blocos —
  const revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // — Livro 3D: ao passar o mouse, abre, folheia as páginas e fecha —
  const book = document.querySelector('[data-book]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (book && 'animate' in Element.prototype) {
    const inner = book.querySelector('.book3d__inner');
    const cover = book.querySelector('.book3d__cover');
    const pageCount = Number(book.dataset.pages) || 6;
    const layer = 1.2; // distância (px) entre as folhas na pilha
    const ease = 'cubic-bezier(.45, .05, .35, 1)';

    // Folhas em branco, empilhadas sob a capa
    const pages = Array.from({ length: pageCount }, (_, i) => {
      const page = document.createElement('div');
      page.className = 'book3d__page';
      page.setAttribute('aria-hidden', 'true');
      inner.insertBefore(page, cover);
      return { el: page, z: (pageCount - i) * layer };
    });

    const coverZ = (pageCount + 1) * layer;
    const turn = (deg, z) => `rotateY(${deg}deg) translateZ(${z}px)`;

    pages.forEach(({ el, z }) => { el.style.transform = turn(0, z); });
    cover.style.transform = turn(0, coverZ);

    // Linha do tempo (ms)
    const OPEN_AT = 300, OPEN_TIME = 800;
    const FLIP_AT = OPEN_AT + OPEN_TIME, FLIP_GAP = 260, FLIP_TIME = 650;
    const HOLD_UNTIL = FLIP_AT + (pageCount - 1) * FLIP_GAP + FLIP_TIME + 350;
    const BACK_GAP = 90, BACK_TIME = 450;
    const CLOSE_AT = HOLD_UNTIL + (pageCount - 1) * BACK_GAP + 350, CLOSE_TIME = 750;
    const TOTAL = CLOSE_AT + CLOSE_TIME + 450;
    const at = (ms) => ms / TOTAL;

    // Gira uma folha (ou a capa) para a esquerda e depois a devolve
    const flip = (el, z, openAt, openTime, closeAt, closeTime) => el.animate([
      { transform: turn(0, z), offset: 0 },
      { transform: turn(0, z), offset: at(openAt), easing: ease },
      { transform: turn(-180, z), offset: at(openAt + openTime) },
      { transform: turn(-180, z), offset: at(closeAt), easing: ease },
      { transform: turn(0, z), offset: at(closeAt + closeTime) },
      { transform: turn(0, z), offset: 1 }
    ], { duration: TOTAL }).finished;

    let playing = false;

    const play = async () => {
      if (playing || reducedMotion.matches) return;
      playing = true;

      // Aberto, o livro ocupa o dobro da largura: centraliza e reduz se faltar espaço
      const available = book.parentElement.clientWidth * 0.96;
      const scale = Math.min(1, available / (book.offsetWidth * 2));
      const open = `translateX(${scale * 50}%) scale(${scale}) rotateX(8deg) rotate(0deg)`;
      const closed = 'translateX(0%) scale(1) rotateX(0deg) rotate(-2deg)';

      const animations = [
        inner.animate([
          { transform: closed, offset: 0, easing: ease },
          { transform: open, offset: at(OPEN_AT + 300) },
          { transform: open, offset: at(CLOSE_AT + CLOSE_TIME - 200), easing: ease },
          { transform: closed, offset: 1 }
        ], { duration: TOTAL }).finished,
        flip(cover, coverZ, OPEN_AT, OPEN_TIME, CLOSE_AT, CLOSE_TIME),
        ...pages.map(({ el, z }, i) => flip(
          el, z,
          FLIP_AT + i * FLIP_GAP, FLIP_TIME,
          HOLD_UNTIL + (pageCount - 1 - i) * BACK_GAP, BACK_TIME
        ))
      ];

      try { await Promise.all(animations); } catch (e) { /* animação cancelada */ }
      playing = false;
    };

    book.addEventListener('pointerenter', play);
    book.addEventListener('click', play);
  }

  // — Ano atual no rodapé —
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
