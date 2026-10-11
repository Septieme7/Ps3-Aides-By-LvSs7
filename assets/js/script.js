/* ============================================================
   GUIDE PS3 — SCRIPT PRINCIPAL
   Thème · TOC gauche · Recherche · Scroll-spy · Progression
   ============================================================ */

(function () {
    'use strict';

    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const backToTop = document.getElementById('backToTop');
    const progressBar = document.getElementById('progressBar');
    const layout = document.getElementById('layout');
    const tocSidebar = document.getElementById('tocSidebar');
    const tocToggle = document.getElementById('tocToggle');
    const tocClose = document.getElementById('tocClose');
    const tocOverlay = document.getElementById('tocOverlay');
    const tocLinks = document.querySelectorAll('.toc-link');
    const searchToggle = document.getElementById('searchToggle');
    const searchPanel = document.getElementById('searchPanel');
    const searchInput = document.getElementById('searchInput');
    const searchClose = document.getElementById('searchClose');
    const searchResults = document.getElementById('searchResults');
    const searchOverlay = document.getElementById('searchOverlay');
    const STORAGE_KEY = 'guide-ps3-theme';
    const TOC_STORAGE_KEY = 'guide-ps3-toc-visible';

    /* ============================================================
       1. THÈME
       ============================================================ */
    function getPreferredTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }
    applyTheme(getPreferredTheme());
    themeToggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    /* ============================================================
       2. TOC
       ============================================================ */
    function isMobile() { return window.innerWidth <= 992; }

    function showToc() {
        if (isMobile()) {
            tocSidebar.classList.add('open');
            tocOverlay.classList.add('visible');
            document.body.classList.add('toc-open');
            document.body.style.overflow = 'hidden';
        } else {
            layout.classList.remove('toc-hidden');
            localStorage.setItem(TOC_STORAGE_KEY, 'visible');
        }
    }

    function hideToc() {
        if (isMobile()) {
            tocSidebar.classList.remove('open');
            tocOverlay.classList.remove('visible');
            document.body.classList.remove('toc-open');
            document.body.style.overflow = '';
        } else {
            layout.classList.add('toc-hidden');
            localStorage.setItem(TOC_STORAGE_KEY, 'hidden');
        }
    }
    function toggleToc() {
        if (isMobile()) {
            if (tocSidebar.classList.contains('open')) hideToc();
            else showToc();
        } else {
            if (layout.classList.contains('toc-hidden')) showToc();
            else hideToc();
        }
    }

    tocToggle.addEventListener('click', toggleToc);
    tocClose.addEventListener('click', hideToc);
    tocOverlay.addEventListener('click', hideToc);

    function initToc() {
        if (isMobile()) {
            tocSidebar.classList.remove('open');
            layout.classList.remove('toc-hidden');
        } else {
            const saved = localStorage.getItem(TOC_STORAGE_KEY);
            if (saved === 'hidden') layout.classList.add('toc-hidden');
            else layout.classList.remove('toc-hidden');
        }
    }
    initToc();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!isMobile()) {
                tocSidebar.classList.remove('open');
                tocOverlay.classList.remove('visible');
                document.body.style.overflow = '';
            }
            initToc();
        }, 150);
    });

    tocLinks.forEach((link) => {
        link.addEventListener('click', () => {
            if (isMobile()) setTimeout(hideToc, 250);
        });
    });

    /* ============================================================
       3. RECHERCHE
       ============================================================ */
    const sectionsIndex = [];
    document.querySelectorAll('section[id]').forEach((section) => {
        const id = section.id;
        const titleEl = section.querySelector('h2');
        const title = titleEl ? titleEl.textContent.trim() : id;
        const text = section.innerText.replace(/\s+/g, ' ').trim();
        sectionsIndex.push({ id, title, text });
    });

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function normalize(str) {
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function runSearch(query) {
        const q = normalize(query.trim());
        searchResults.innerHTML = '';
        if (!q) {
            searchResults.innerHTML = '<p class="search-panel__empty">Commencez à taper pour rechercher...</p>';
            return;
        }
        const results = [];
        sectionsIndex.forEach((sec) => {
            const nText = normalize(sec.text);
            const idx = nText.indexOf(q);
            if (idx !== -1) {
                const start = Math.max(0, idx - 60);
                const end = Math.min(sec.text.length, idx + q.length + 100);
                let snippet = sec.text.substring(start, end);
                if (start > 0) snippet = '…' + snippet;
                if (end < sec.text.length) snippet = snippet + '…';
                results.push({ id: sec.id, title: sec.title, snippet });
            }
        });
        if (results.length === 0) {
            searchResults.innerHTML = '<p class="search-panel__empty">Aucun résultat trouvé.</p>';
            return;
        }
        results.forEach((r) => {
            const a = document.createElement('a');
            a.href = '#' + r.id;
            a.className = 'search-result';
            const safeSnippet = escapeHtml(r.snippet);
            const regex = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
            const highlighted = safeSnippet.replace(regex, '<mark>$1</mark>');
            a.innerHTML = `
                <span class="search-result__title">${escapeHtml(r.title)}</span>
                <span class="search-result__snippet">${highlighted}</span>
            `;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                closeSearch();
                const target = document.querySelector('#' + r.id);
                if (target) {
                    const offsetTop = target.getBoundingClientRect().top + window.scrollY - 20;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    history.pushState(null, '', '#' + r.id);
                }
            });
            searchResults.appendChild(a);
        });
    }

    function openSearch() {
        searchPanel.classList.add('open');
        searchOverlay.classList.add('visible');
        searchPanel.setAttribute('aria-hidden', 'false');
        setTimeout(() => searchInput.focus(), 100);
    }
    function closeSearch() {
        searchPanel.classList.remove('open');
        searchOverlay.classList.remove('visible');
        searchPanel.setAttribute('aria-hidden', 'true');
        searchInput.value = '';
        searchResults.innerHTML = '<p class="search-panel__empty">Commencez à taper pour rechercher...</p>';
    }

    searchToggle.addEventListener('click', openSearch);
    searchClose.addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', closeSearch);

    let searchDebounce;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => runSearch(e.target.value), 120);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (searchPanel.classList.contains('open')) closeSearch();
            else if (tocSidebar.classList.contains('open')) hideToc();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            openSearch();
        }
    });

    /* ============================================================
       4. SMOOTH SCROLL
       ============================================================ */
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (!target) return;
            e.preventDefault();
            const offsetTop = target.getBoundingClientRect().top + window.scrollY - 20;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            history.pushState(null, '', targetId);
        });
    });

    /* ============================================================
       5. SCROLL-SPY (corrigé)
       -----------------------------------------------------------
       AVANT (bugué) :
           if (section.offsetTop <= scrollPos) currentId = section.id;

       `section.offsetTop` est relatif à l'offsetParent (ici .layout,
       qui a position: relative), PAS au document. Résultat : décalage
       systématique d'1 à 3 crans dans la surbrillance du sommaire.

       MAINTENANT :
           const top = section.getBoundingClientRect().top + window.scrollY;
       On obtient une position absolue dans le document, directement
       comparable à window.scrollY.
       ============================================================ */
    const sections = document.querySelectorAll('section[id]');

    function getDocTop(el) {
        return el.getBoundingClientRect().top + window.scrollY;
    }

    function updateActiveLink() {
        // Ligne de déclenchement : à 100 px sous le haut du viewport.
        const scrollPos = window.scrollY + 100;
        let currentId = '';

        sections.forEach((section) => {
            if (getDocTop(section) <= scrollPos) currentId = section.id;
        });

        // Si l'utilisateur est encore au-dessus de la 1ère section
        // (page tout en haut), on surligne la 1ère section par défaut.
        if (!currentId && sections.length > 0) {
            currentId = sections[0].id;
        }

        tocLinks.forEach((link) => {
            const href = link.getAttribute('href').substring(1);
            link.classList.toggle('active', href === currentId);
        });
    }

    /* ============================================================
       6. SCROLL GLOBAL
       ============================================================ */
    let ticking = false;
    function onScroll() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (progressBar) {
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = progress + '%';
        }
        if (scrollTop > 400) backToTop.classList.add('visible');
        else backToTop.classList.remove('visible');
        updateActiveLink();
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    onScroll();
})();