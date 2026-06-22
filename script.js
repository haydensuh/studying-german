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

  /* ── Review page ── */
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[char];
    });
  }

  function initReviewPage() {
    var reviewList = document.getElementById('reviewList');
    if (!reviewList) return;

    var days = window.GERMAN_REVIEW_DAYS || [];
    var reviewSearch = document.getElementById('reviewSearch');
    var reviewResult = document.getElementById('reviewResult');
    var dateTabs = document.getElementById('dateTabs');
    var reviewStats = document.getElementById('reviewStats');
    var quizDirection = document.getElementById('quizDirection');
    var quizDate = document.getElementById('quizDate');
    var quizPrompt = document.getElementById('quizPrompt');
    var quizAnswer = document.getElementById('quizAnswer');
    var quizHelp = document.getElementById('quizHelp');
    var showAnswerBtn = document.getElementById('showAnswerBtn');
    var nextQuizBtn = document.getElementById('nextQuizBtn');
    var activeDate = 'all';
    var flatItems = [];
    var currentQuiz = null;
    var progressKey = 'deutsch-wiki-review-progress-v1';

    days.forEach(function (day) {
      day.items.forEach(function (item) {
        flatItems.push({
          day: day,
          item: item
        });
      });
    });

    function loadProgress() {
      try {
        return JSON.parse(localStorage.getItem(progressKey)) || {};
      } catch (error) {
        return {};
      }
    }

    function saveProgress(progress) {
      localStorage.setItem(progressKey, JSON.stringify(progress));
    }

    function getItemProgress(progress, id) {
      if (!progress[id]) {
        progress[id] = {
          seen: 0,
          deToKo: 0,
          koToDe: 0,
          lastSeen: 0
        };
      }
      return progress[id];
    }

    function getSearchText(day, item) {
      return [
        day.date,
        day.title,
        day.summary,
        item.de,
        item.ko,
        (item.tags || []).join(' '),
        JSON.stringify(item.words || []),
        (item.grammar || []).join(' '),
        (item.confusion || []).join(' ')
      ].join(' ').toLowerCase();
    }

    function renderStats() {
      var progress = loadProgress();
      var totalSeen = flatItems.reduce(function (sum, pair) {
        return sum + getItemProgress(progress, pair.item.id).seen;
      }, 0);

      reviewStats.innerHTML = [
        '<span class="review-stat-number">' + flatItems.length + '</span>',
        '<span class="review-stat-label">누적 학습 카드</span>',
        '<span class="review-stat-number">' + totalSeen + '</span>',
        '<span class="review-stat-label">지금까지 출제된 문제</span>'
      ].join('');
    }

    function renderTabs() {
      var tabs = [{ date: 'all', label: '전체' }].concat(days.map(function (day) {
        return {
          date: day.date,
          label: day.date
        };
      }));

      dateTabs.innerHTML = tabs.map(function (tab) {
        return '<button class="date-tab' + (tab.date === activeDate ? ' active' : '') + '" type="button" data-date="' + escapeHtml(tab.date) + '">' + escapeHtml(tab.label) + '</button>';
      }).join('');
    }

    function renderCards() {
      var query = (reviewSearch.value || '').trim().toLowerCase();
      var visibleCount = 0;
      var html = '';

      days.forEach(function (day) {
        if (activeDate !== 'all' && day.date !== activeDate) return;

        var items = day.items.filter(function (item) {
          return !query || getSearchText(day, item).includes(query);
        });
        if (items.length === 0) return;

        visibleCount += items.length;
        html += '<article class="review-day">';
        html += '<div class="review-day-header">';
        html += '<div><h3 class="review-day-title">' + escapeHtml(day.date + ' · ' + day.title) + '</h3>';
        html += '<p class="review-day-summary">' + escapeHtml(day.summary || '') + '</p></div>';
        html += '<span class="review-day-summary">' + items.length + '개 카드</span>';
        html += '</div><div class="review-card-grid">';

        items.forEach(function (item) {
          var tags = (item.tags || []).map(function (tag) {
            return '<span class="tag">' + escapeHtml(tag) + '</span>';
          }).join('');
          var rows = (item.words || []).map(function (row) {
            return '<tr><td>' + escapeHtml(row[0]) + '</td><td>' + escapeHtml(row[1]) + '</td></tr>';
          }).join('');
          var notes = (item.grammar || []).concat(item.confusion || []).slice(0, 4).map(function (note) {
            return '<li>' + escapeHtml(note) + '</li>';
          }).join('');

          html += '<details class="review-card">';
          html += '<summary><div class="review-card-de">' + escapeHtml(item.de) + '</div>';
          html += '<div class="review-card-ko">' + escapeHtml(item.ko) + '</div>';
          html += '<div class="tags">' + tags + '</div></summary>';
          html += '<div class="review-card-body"><table class="mini-table"><tbody>' + rows + '</tbody></table>';
          html += '<ul class="review-notes">' + notes + '</ul></div></details>';
        });

        html += '</div></article>';
      });

      reviewList.innerHTML = html || '<p class="search-result">표시할 복습 카드가 없습니다.</p>';
      reviewResult.textContent = '총 ' + flatItems.length + '개 카드 중 ' + visibleCount + '개 표시';
    }

    function pickQuiz() {
      var progress = loadProgress();
      var minSeen = Math.min.apply(null, flatItems.map(function (pair) {
        return getItemProgress(progress, pair.item.id).seen;
      }));
      var candidates = flatItems.filter(function (pair) {
        return getItemProgress(progress, pair.item.id).seen === minSeen;
      });
      var selected = candidates[Math.floor(Math.random() * candidates.length)];
      var itemProgress = getItemProgress(progress, selected.item.id);
      var direction = itemProgress.deToKo < itemProgress.koToDe ? 'deToKo' : 'koToDe';

      if (itemProgress.deToKo === itemProgress.koToDe) {
        direction = Math.random() < 0.5 ? 'deToKo' : 'koToDe';
      }

      itemProgress.seen += 1;
      itemProgress[direction] += 1;
      itemProgress.lastSeen = Date.now();
      saveProgress(progress);

      currentQuiz = {
        day: selected.day,
        item: selected.item,
        direction: direction
      };
      renderQuiz();
      renderStats();
    }

    function renderQuiz() {
      if (!currentQuiz) return;

      var isDeToKo = currentQuiz.direction === 'deToKo';
      var item = currentQuiz.item;
      var helperNotes = (item.grammar || []).concat(item.confusion || []).slice(0, 2);

      quizDirection.textContent = isDeToKo ? '독일어 → 한국어' : '한국어 → 독일어';
      quizDate.textContent = currentQuiz.day.date;
      quizPrompt.textContent = isDeToKo ? item.de : item.ko;
      quizAnswer.innerHTML = escapeHtml(isDeToKo ? item.ko : item.de)
        + (helperNotes.length ? '<small>' + escapeHtml(helperNotes.join(' ')) + '</small>' : '');
      quizAnswer.hidden = true;
      quizHelp.textContent = '적게 나온 카드가 먼저 선택됩니다. 같은 카드 안에서는 양방향 번역이 균형 있게 나옵니다.';
    }

    renderTabs();
    renderCards();
    renderStats();
    if (flatItems.length > 0) pickQuiz();

    reviewSearch.addEventListener('input', renderCards);
    dateTabs.addEventListener('click', function (event) {
      var button = event.target.closest('.date-tab');
      if (!button) return;
      activeDate = button.getAttribute('data-date');
      renderTabs();
      renderCards();
    });
    showAnswerBtn.addEventListener('click', function () {
      quizAnswer.hidden = false;
    });
    nextQuizBtn.addEventListener('click', pickQuiz);
  }

  initReviewPage();

  /* ── Resize: close sidebar on desktop ── */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) closeSidebar();
  });
})();
