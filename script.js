const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
const year = document.querySelector('#year');

if (year) year.textContent = new Date().getFullYear();

if (menuButton && navLinks) {
  const mobile = window.matchMedia('(max-width: 820px)');
  function setOpen(open, restoreFocus = false) {
    if (restoreFocus) menuButton.focus();
    menuButton.setAttribute('aria-expanded', String(open));
    navLinks.hidden = mobile.matches && !open;
  }
  function syncLayout() {
    const focusInNav = navLinks.contains(document.activeElement);
    menuButton.hidden = !mobile.matches;
    setOpen(false, mobile.matches && focusInNav);
  }
  menuButton.addEventListener('click', () => {
    setOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && !navLinks.hidden) {
      setOpen(false, true);
    }
  });
  navLinks.addEventListener('click', event => {
    if (mobile.matches && event.target.closest('a')) setOpen(false, true);
  });
  mobile.addEventListener('change', syncLayout);
  syncLayout();
}
