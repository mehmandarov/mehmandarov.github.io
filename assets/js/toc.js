// Sets the initial expanded/collapsed state of the post Table of Contents
// based on viewport width and the per-screen defaults configured in _config.yml
// (exposed via data attributes on the <details> element). User clicks after
// load toggle it normally.
(function () {
  function applyTocState() {
    document.querySelectorAll('details.page__toc').forEach(function (toc) {
      var breakpoint = parseInt(toc.getAttribute('data-toc-breakpoint'), 10) || 768;
      var openOnDesktop = toc.getAttribute('data-toc-desktop') === 'true';
      var openOnMobile = toc.getAttribute('data-toc-mobile') === 'true';
      var isDesktop = window.matchMedia('(min-width: ' + breakpoint + 'px)').matches;
      toc.open = isDesktop ? openOnDesktop : openOnMobile;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTocState);
  } else {
    applyTocState();
  }
})();
