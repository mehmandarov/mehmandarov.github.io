// Pagefind Component UI currently does not expose result sorting in markup.
// Patch the internal instance so every search request includes
// `sort: { date: 'desc' }` using `data-pagefind-sort` metadata.
(function () {
    function ensurePagefindDateSorting() {
        if (!window.PagefindComponents || typeof window.PagefindComponents.getInstanceManager !== 'function') return;
        var manager = window.PagefindComponents.getInstanceManager();
        if (!manager || typeof manager.getInstance !== 'function') return;

        var instance = manager.getInstance('default');
        if (!instance || instance.__dateSortPatchApplied) return;

        var originalLoad = instance.__load__ && instance.__load__.bind(instance);
        if (typeof originalLoad !== 'function') return;

        instance.__load__ = async function () {
            await originalLoad();
            if (!this.__pagefind__ || this.__pagefind__.__dateSortPatchApplied) return;

            var originalSearch = this.__pagefind__.search.bind(this.__pagefind__);
            this.__pagefind__.search = function (term, options) {
                var opts = options || {};
                return originalSearch(term, Object.assign({}, opts, { sort: { date: 'desc' } }));
            };

            this.__pagefind__.__dateSortPatchApplied = true;
        };

        instance.__dateSortPatchApplied = true;
    }

    window.ensurePagefindDateSorting = ensurePagefindDateSorting;
})();

