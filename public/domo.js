/* Responsive source selection is applied before the page's video observers play. */
(() => {
  const source = matchMedia('(max-width: 768px)').matches
    ? '/videos/domo-hero-mobile.webm'
    : '/videos/domo-story.webm';
  function prepareHero() {
    const hero = document.querySelector('#home-landscape video');
    if (hero && hero.getAttribute('src') !== source) {
      hero.src = source;
      hero.muted = true;
      hero.playsInline = true;
    }
    if (matchMedia('(max-width: 768px)').matches) {
      for (const preview of document.querySelectorAll('#home-story video')) {
        if (preview.getAttribute('src') !== source) preview.src = source;
      }
    }
  }
  prepareHero();
  new MutationObserver(prepareHero).observe(document.getElementById('main'), { childList: true });
})();
