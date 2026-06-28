---
---
/* Jekyll Simple Search initialisation */
(function () {
  if (typeof SimpleJekyllSearch !== 'function') return;
  SimpleJekyllSearch({
    searchInput: document.getElementById('js-search-input'),
    resultsContainer: document.getElementById('js-results-container'),
    json: '{{ "/search.json" | relative_url }}',
    searchResultTemplate: '<a href="{url}" class="search-results__link"><div class="search-results-title">{title}</div><div class="search-results-description">{content}</div></a>',
    noResultsText: '<div class="no-results">No results found...</div>'
  });
})();
