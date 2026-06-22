(function () {
  'use strict';

  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('overlay');
  var menuBtn = document.getElementById('menuBtn');
  var sidebarClose = document.getElementById('sidebarClose');
  var searchInput = document.getElementById('searchInput');
  var searchClear = document.getElementById('searchClear');
  var searchResult = document.getElementById('searchResult');
  var navLinks = document.querySelectorAll('.nav-link');
  var sections = document.querySelectorAll('.section');
  var cards = document.querySelectorAll('.card[data-searchable]');

  /* ── Sidebar ── */
  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  /* ── Active nav by current page ── */
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href) return;

    var linkPath = href.split('/').pop();
    var isActive = linkPath === currentPath
      || (currentPath === '' && linkPath === 'index.html')
      || (currentPath === 'index.html' && linkPath === 'index.html');

    link.classList.toggle('active', isActive);
  });

  /* ── Card collapse / expand ── */
  document.querySelectorAll('.card-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var expanded = header.getAttribute('aria-expanded') === 'true';
      var body = header.nextElementSibling;

      header.setAttribute('aria-expanded', String(!expanded));
      body.hidden = expanded;
    });
  });

  /* ── Search ── */
  if (searchInput) {
    function getSearchableText(card) {
      return card.textContent.toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function performSearch(query) {
      var q = query.toLowerCase().trim();
      var matchCount = 0;

      searchClear.hidden = q.length === 0;
      searchResult.hidden = q.length === 0;

      cards.forEach(function (card) {
        if (!q) {
          card.classList.remove('hidden-by-search');
          return;
        }

        var text = getSearchableText(card);
        var match = text.includes(q);
        card.classList.toggle('hidden-by-search', !match);
        if (match) matchCount++;
      });

      sections.forEach(function (section) {
        var visibleCards = section.querySelectorAll('.card:not(.hidden-by-search)');
        section.classList.toggle('all-hidden', q.length > 0 && visibleCards.length === 0);
      });

      if (q) {
        searchResult.textContent = matchCount > 0
          ? matchCount + '개 결과'
          : '검색 결과가 없습니다';
      }
    }

    searchInput.addEventListener('input', function () {
      performSearch(searchInput.value);
    });

    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      performSearch('');
      searchInput.focus();
    });
  }

  /* ── Resize: close sidebar on desktop ── */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) closeSidebar();
  });
})();
