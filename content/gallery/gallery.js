// Gallery lightbox: opens the full-size photo in a dialog with previous/next.
// Without JavaScript (or <dialog> support) each thumbnail still links to the full-size file.
(function () {
  const dialog = document.querySelector('.lightbox');
  const items = Array.from(document.querySelectorAll('.gallery-item'));
  if (!dialog || !items.length || typeof dialog.showModal !== 'function') return;

  const img = dialog.querySelector('.lightbox-img');
  const caption = dialog.querySelector('.lightbox-caption');
  const prevBtn = dialog.querySelector('.lightbox-prev');
  const nextBtn = dialog.querySelector('.lightbox-next');
  const closeBtn = dialog.querySelector('.lightbox-close');
  let group = [];
  let index = 0;
  let opener = null;

  function show(i) {
    index = (i + group.length) % group.length;
    const link = group[index];
    const thumb = link.querySelector('img');
    img.src = thumb.src;            // show the cached thumbnail instantly...
    img.alt = thumb.alt;
    const full = new Image();       // ...then swap in the full-size photo once loaded
    full.onload = () => { if (group[index] === link) img.src = link.href; };
    full.src = link.href;
    const title = document.getElementById(link.dataset.group + '-title');
    caption.textContent = (title ? title.textContent + ' — ' : '') + 'photo ' + (index + 1) + ' of ' + group.length;
    // preload neighbours so next/previous feel instant
    [index + 1, index - 1].forEach(n => { new Image().src = group[(n + group.length) % group.length].href; });
  }

  items.forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      opener = link;
      group = items.filter(item => item.dataset.group === link.dataset.group);
      show(group.indexOf(link));
      dialog.showModal();
      closeBtn.focus();
    });
  });

  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));
  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
  });
  dialog.addEventListener('close', () => {
    img.removeAttribute('src');
    if (opener) opener.focus();
  });

  // swipe left/right on touch screens
  let startX = null;
  dialog.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
