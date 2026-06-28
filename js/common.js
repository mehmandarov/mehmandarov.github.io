document.addEventListener("DOMContentLoaded", function() {
  'use strict';

  const html = document.querySelector('html'),
    globalWrap = document.querySelector('.global-wrap'),
    body = document.querySelector('body'),
    menuToggle = document.querySelector(".hamburger"),
    menuList = document.querySelector(".main-nav"),
    searchOpenButton = document.querySelectorAll(".js-search-open"),
    searchCloseIcon = document.querySelector(".search__close"),
    searchOverlay = document.querySelector(".search__overlay"),
    searchInput = document.querySelector(".search__text"),
    search = document.querySelector(".search"),
    toggleTheme = document.querySelector(".toggle-theme"),
    blogViewButton = document.querySelector(".blog__toggle"),
    splides = document.querySelector(".logos__slider"),
    tabButtons = document.querySelectorAll('.clients__tabs__control'),
    tabContents = document.querySelectorAll('.clients__tabs__item'),
    btnScrollToTop = document.querySelector(".top");


  /* =======================================================
  // Menu + Search + Theme Switcher + Blog List View
  ======================================================= */
  menuToggle.addEventListener("click", () => {
    menu();
  });

  searchOpenButton.forEach(button => {
    button.addEventListener("click", searchOpen);
  });

  searchCloseIcon.addEventListener("click", () => {
    searchClose();
  });

  searchOverlay.addEventListener("click", () => {
    searchClose();
  });

  if (blogViewButton) {
    blogViewButton.addEventListener("click", () => {
      viewToggle();
    });
  }


  // Menu
  function menu() {
    menuToggle.classList.toggle("is-open");
    menuList.classList.toggle("is-visible");
  }

  // Dropdown Menu
  document.querySelectorAll('.dropdown-toggle').forEach(function(toggle) {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();

      document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
        if (menu !== toggle.nextElementSibling) {
          menu.classList.remove('is-visible');
        }
      });

      this.nextElementSibling.classList.toggle('is-visible');
    });
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav__item')) {
      document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
        menu.classList.remove('is-visible');
      });
    }

    const isClickInsideMenu = e.target.closest('.main-nav');
    const isClickOnToggle = e.target.closest('.hamburger');

    if (!isClickInsideMenu && !isClickOnToggle) {
      menuList.classList.remove('is-visible');
      menuToggle.classList.remove('is-open');
    }
  });


  // Search
  function searchOpen() {
    search.classList.add("is-visible");
    body.classList.add("is-fixed");
    globalWrap.classList.add("is-active");
    menuToggle.classList.remove("is-open");
    menuList.classList.remove("is-visible");
    setTimeout(function () {
      searchInput.focus();
    }, 250);
  }

  function searchClose() {
    search.classList.remove("is-visible");
    body.classList.remove("is-fixed");
    globalWrap.classList.remove("is-active");
  }

  // Search: keyboard shortcut (Cmd/Ctrl + K) to toggle the overlay.
  // We preventDefault to override the browser's default Ctrl/Cmd+K
  // (focus search/address bar) – this is the de-facto search-palette
  // shortcut (GitHub, Algolia, Linear, Slack all use it).
  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

  document.addEventListener('keydown', function (e) {
    const usingCmdK = (isMac ? e.metaKey : e.ctrlKey) && (e.key === 'k' || e.key === 'K');
    if (usingCmdK) {
      e.preventDefault();
      if (search.classList.contains('is-visible')) {
        searchClose();
      } else {
        searchOpen();
      }
    }
  });

  // Show the platform-correct shortcut hint(s) in the UI.
  document.querySelectorAll('.js-search-shortcut').forEach(function (el) {
    el.textContent = isMac ? '\u2318 K' : 'Ctrl K';
  });

  // Search: arrow-key navigation through results + Enter to open.
  const resultsContainer = document.getElementById('js-results-container');
  let selectedIndex = -1;

  function searchResultLinks() {
    return resultsContainer
      ? Array.prototype.slice.call(resultsContainer.querySelectorAll('.search-results__link'))
      : [];
  }

  function highlightResult(index) {
    const links = searchResultLinks();
    links.forEach(function (link, i) {
      link.classList.toggle('is-selected', i === index);
    });
    if (index >= 0 && links[index]) {
      links[index].scrollIntoView({ block: 'nearest' });
    }
  }

  if (searchInput && resultsContainer) {
    // Typing re-renders the result list, so reset the selection.
    searchInput.addEventListener('input', function () {
      selectedIndex = -1;
    });

    searchInput.addEventListener('keydown', function (e) {
      const links = searchResultLinks();
      if (!links.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % links.length;
        highlightResult(selectedIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + links.length) % links.length;
        highlightResult(selectedIndex);
      } else if (e.key === 'Enter') {
        const target = links[selectedIndex] || links[0];
        if (target) {
          e.preventDefault();
          window.location.href = target.getAttribute('href');
        }
      }
    });
  }

  document.addEventListener('keydown', function(e){
    if (e.key == 'Escape') {
      searchClose();
    }
  });


  // Theme Switcher
  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      darkMode();
    });
  };

  function darkMode() {
    if (html.classList.contains('dark-mode')) {
      html.classList.remove('dark-mode');
      localStorage.removeItem("theme");
      document.documentElement.removeAttribute("dark");
    } else {
      html.classList.add('dark-mode');
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute("dark", "");
    }
  };


  // Blog List View
  function viewToggle() {
    if (html.classList.contains('view-list')) {
      html.classList.remove('view-list');
      localStorage.removeItem("classView");
      document.documentElement.removeAttribute("list");
    } else {
      html.classList.add('view-list');
      localStorage.setItem("classView", "list");
      document.documentElement.setAttribute("list", "");
    }
  }


  /* ============================
  // Logos Slider
  ============================ */
  if (splides) {
    new Splide(splides, {
      direction: 'ltr',
      clones: 8,
      gap: 32,
      autoWidth: true,
      drag: true,
      arrows: false,
      pagination: false,
      type: 'loop',
      autoScroll: {
        autoStart: true,
        speed: 0.4,
        pauseOnHover: false,
        pauseOnFocus: false
      },
      intersection: {
        inView: {
          autoScroll: true,
        },
        outView: {
          autoScroll: false,
        }
      },
    }).mount(window.splide.Extensions);
  }


  /* ============================
  // Clients Tabs
  ============================ */
  if (tabButtons && tabContents) {
    tabButtons.forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const tabId = tabBtn.getAttribute('data-id');

        tabButtons.forEach((btn) => btn.classList.remove('active'));
        tabBtn.classList.add('active');

        tabContents.forEach((content) => {
          content.classList.remove('active');

          if (content.id === tabId) {
            content.classList.add('active');
          }
        });
      });
    });
  }


  /* ================================================================
  // Stop Animations During Window Resizing and Switching Theme Modes
  ================================================================ */
  let disableTransition;

  if (toggleTheme) {
    toggleTheme.addEventListener("click", () => {
      stopAnimation();
    });
  }

  window.addEventListener("resize", () => {
    stopAnimation();
  });

  function stopAnimation() {
    document.body.classList.add("disable-animation");
    clearTimeout(disableTransition);
    disableTransition = setTimeout(() => {
      document.body.classList.remove("disable-animation");
    }, 100);
  };


  /* =======================
  // Responsive Videos
  ======================= */
  reframe(".post iframe:not(.reframe-off), .page iframe:not(.reframe-off)");


  /* =======================
  // LazyLoad Images
  ======================= */
  var lazyLoadInstance = new LazyLoad({
    elements_selector: ".lazy"
  })


  /* =======================
  // Zoom Image
  ======================= */
  const lightense = document.querySelector(".page__content img, .post__content img, .gallery__image img"),
  imageLink = document.querySelectorAll(".page__content a img, .post__content a img, .gallery__image a img");

  if (imageLink) {
    for (const i = 0; i < imageLink.length; i++) imageLink[i].parentNode.classList.add("image-link");
    for (const i = 0; i < imageLink.length; i++) imageLink[i].classList.add("no-lightense");
  };

  if (lightense) {
    Lightense(".page__content img:not(.no-lightense), .post__content img:not(.no-lightense), .gallery__image img:not(.no-lightense)", {
    padding: 60,
    offset: 30
    });
  };


  /* =================================
  // Accordion
  ================================= */
  const items = document.querySelectorAll(".faq__inner .faq__item");

  function toggleAccordion() {
    const itemToggle = this.getAttribute('data-name');

    if (itemToggle === 'closed') {
      this.setAttribute('data-name', 'open');
    } else {
      this.setAttribute('data-name', 'closed');
    }
  }

  items.forEach(item => {
    item.addEventListener('click', toggleAccordion);
    item.addEventListener('keydown', function(event) {
      if (event.keyCode === 13) {
        toggleAccordion.call(this);
      }
    });
  });




  // =====================
  // Copy Code Button
  // =====================
  document.querySelectorAll('.post__content pre.highlight, .page__content pre.highlight')
  .forEach(function (pre) {
    const button = document.createElement('button');
    const copyText = 'Copy';
    button.type = 'button';
    button.ariaLabel = 'Copy code to clipboard';
    button.innerText = copyText;
    button.addEventListener('click', function () {
      let code = pre.querySelector('code').innerText;
      try {
        code = code.trimEnd();
      } catch (e) {
        code = code.trim();
      }
      navigator.clipboard.writeText(code);
      button.innerText = 'Copied!';
      setTimeout(function () {
        button.blur();
        button.innerText = copyText;
      }, 2e3);
    });
    pre.appendChild(button);
  });


  // =====================
  // Load More Posts
  // =====================
  var load_posts_button = document.querySelector(".load-more-posts");

  load_posts_button&&load_posts_button.addEventListener("click",function(e){e.preventDefault();var t=load_posts_button.textContent;load_posts_button.classList.add("button--loading"),load_posts_button.textContent="Loading";var o=pagination_next_url.split("/page")[0]+"/page/"+pagination_next_page_number+"/";fetch(o).then(function(e){if(e.ok)return e.text()}).then(function(e){var t=document.createElement("div");t.innerHTML=e;for(var o=document.querySelector(".grid"),n=t.querySelectorAll(".grid__post"),a=0;a<n.length;a++)o.appendChild(n.item(a));new LazyLoad({elements_selector:".lazy"}),updateUI(),pagination_next_page_number++,pagination_next_page_number>pagination_available_pages_number&&(load_posts_button.style.display="none",document.querySelector(".load-more-complete").style.display="block")}).finally(function(){load_posts_button.classList.remove("button--loading"),load_posts_button.textContent=t})});


  /* =======================
  // Scroll Top Button
  ======================= */
  window.addEventListener("scroll", function () {
  window.scrollY > window.innerHeight ? btnScrollToTop.classList.add("is-active") : btnScrollToTop.classList.remove("is-active");
  });

  btnScrollToTop.addEventListener("click", function () {
    if (window.scrollY != 0) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      })
    }
  });

});

