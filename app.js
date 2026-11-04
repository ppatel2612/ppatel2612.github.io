(() => {
  'use strict';
  const config = window.PORTFOLIO_CONFIG;
  const $ = selector => document.querySelector(selector);
  const colors = { JavaScript: '#b39728', TypeScript: '#3178c6', Python: '#527c9c', HTML: '#d16b49', Java: '#b46d49', C: '#777c93', MATLAB: '#c07b43' };
  const state = { repos: [], query: '', language: 'All', sort: 'recent', forks: false };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeUrl = value => {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? escape(url.href) : ''; }
    catch { return ''; }
  };
  const languageMarkup = language => `<span class="language"><span class="language-dot" style="background:${colors[language] || '#87957c'}"></span>${escape(language || 'Other')}</span>`;
  const repoUrl = repo => `https://github.com/${encodeURIComponent(config.username)}/${encodeURIComponent(repo.name)}`;
  const external = 'target="_blank" rel="noopener noreferrer"';

  function renderFeatured() {
    $('#featured-grid').innerHTML = config.featured.map(feature => {
      const repo = state.repos.find(item => item.name === feature.repo);
      if (!repo) return '';
      return `<article class="featured-card"><div class="project-art ${escape(feature.artwork)}" aria-hidden="true"><span class="symbol">${escape(feature.symbol)}</span><span class="art-label">${escape(feature.category)}</span></div><div class="featured-body"><p class="category">${escape(feature.category)}</p><h3><a href="${repoUrl(repo)}" ${external}>${escape(feature.title)}</a></h3><p class="description">${escape(repo.description || 'Explore the source code and project details on GitHub.')}</p><div class="featured-bottom">${languageMarkup(repo.language)}<a href="${repoUrl(repo)}" ${external} aria-label="View ${escape(feature.title)} source on GitHub">View project ↗</a></div></div></article>`;
    }).join('');
  }

  function renderFilters() {
    const languages = ['All', ...new Set(state.repos.map(repo => repo.language || 'Other').sort())];
    $('#language-filters').innerHTML = languages.map(language => `<button type="button" class="filter" data-language="${escape(language)}" aria-pressed="${language === state.language}">${escape(language)}</button>`).join('');
  }

  function renderRepos() {
    const query = state.query.toLowerCase().trim();
    const repos = state.repos.filter(repo => (state.forks || !repo.fork)
      && (state.language === 'All' || (repo.language || 'Other') === state.language)
      && `${repo.name} ${repo.description || ''} ${repo.language || ''} ${(repo.topics || []).join(' ')}`.toLowerCase().includes(query));
    repos.sort((a, b) => state.sort === 'name' ? a.name.localeCompare(b.name)
      : state.sort === 'stars' ? b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name)
      : new Date(b.pushed_at) - new Date(a.pushed_at));
    $('#result-count').textContent = `${repos.length} ${repos.length === 1 ? 'repository' : 'repositories'}${query ? ` matching “${state.query.trim()}”` : ' to explore'}`;
    $('#repo-grid').innerHTML = repos.map(repo => {
      const demo = safeUrl(repo.homepage);
      const updated = new Date(repo.pushed_at);
      const date = Number.isNaN(updated.getTime()) ? '' : updated.toLocaleDateString('en', { month: 'short', year: 'numeric' });
      return `<article class="repo-card"><div class="repo-card-top"><span class="repo-icon" aria-hidden="true">⌘</span><span>${repo.fork ? '<span class="repo-badge">FORK</span>' : ''}${repo.archived ? '<span class="repo-badge">ARCHIVED</span>' : ''}${demo ? `<a href="${demo}" ${external} aria-label="Visit ${escape(repo.name)} website">Live site ↗</a>` : ''}</span></div><h3><a href="${repoUrl(repo)}" ${external}>${escape(repo.name.replace(/[-_]+/g, ' '))} <span aria-hidden="true">↗</span></a></h3><p>${escape(repo.description || 'Explore the source code and project details on GitHub.')}</p><div class="repo-card-footer">${languageMarkup(repo.language)}<span class="repo-stats"><span aria-label="${Number(repo.stargazers_count) || 0} stars">☆ ${Number(repo.stargazers_count) || 0}</span><span aria-label="${Number(repo.forks_count) || 0} forks">⑂ ${Number(repo.forks_count) || 0}</span></span></div>${date ? `<div class="repo-updated">Updated ${escape(date)}</div>` : ''}</article>`;
    }).join('');
    $('#empty-state').hidden = repos.length !== 0;
    $('#repo-grid').setAttribute('aria-busy', 'false');
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === state.language)));
  }

  function useRepos(repos, label) {
    if (!Array.isArray(repos) || !repos.every(repo => repo && typeof repo.name === 'string')) throw new Error('Invalid repository response');
    state.repos = repos;
    $('#load-error').hidden = true;
    $('#data-status').textContent = label;
    renderFeatured();
    renderFilters();
    renderRepos();
  }

  async function getJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }

  async function load() {
    $('#load-error').hidden = true;
    $('#repo-grid').setAttribute('aria-busy', 'true');
    let hasFallback = false;
    try {
      const saved = await getJson('./data/repos.json');
      if (saved.profile.login.toLowerCase() === config.username.toLowerCase()) {
        useRepos(saved.repos, `Saved ${new Date(saved.fetchedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`);
        hasFallback = true;
      }
    } catch { /* Live GitHub data can still load if the snapshot is missing. */ }
    try {
      const repos = [];
      for (let page = 1; ; page++) {
        const batch = await getJson(`https://api.github.com/users/${encodeURIComponent(config.username)}/repos?per_page=100&sort=pushed&page=${page}`);
        if (!Array.isArray(batch)) throw new Error('Invalid repository response');
        repos.push(...batch);
        if (batch.length < 100) break;
      }
      useRepos(repos, 'Up to date with GitHub');
    } catch {
      if (!hasFallback) {
        $('#load-error').hidden = false;
        $('#featured-grid').textContent = 'Selected work is available on GitHub.';
        $('#result-count').textContent = 'Repositories unavailable';
        $('#repo-grid').setAttribute('aria-busy', 'false');
      }
    }
  }

  $('#search').addEventListener('input', event => { state.query = event.target.value; renderRepos(); });
  $('#sort').addEventListener('change', event => { state.sort = event.target.value; renderRepos(); });
  $('#show-forks').addEventListener('change', event => { state.forks = event.target.checked; renderRepos(); });
  $('#language-filters').addEventListener('click', event => {
    const button = event.target.closest('[data-language]');
    if (button) { state.language = button.dataset.language; renderRepos(); }
  });
  $('#reset-filters').addEventListener('click', () => {
    state.query = ''; state.language = 'All'; state.sort = 'recent'; state.forks = false;
    $('#search').value = ''; $('#sort').value = 'recent'; $('#show-forks').checked = false;
    renderRepos(); $('#search').focus();
  });
  $('#retry').addEventListener('click', load);
  load();
})();
