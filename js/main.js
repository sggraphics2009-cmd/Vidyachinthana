document.addEventListener('DOMContentLoaded', async () => {
  const themeToggle = document.getElementById('themeToggle');
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });

  await loadCurrentIssue();
  await loadArchivePreview();
  await loadTopCreators();

  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('active'));
  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) mobileMenu.classList.remove('active');
  });

  document.getElementById('archiveLink')?.addEventListener('click', (e) => { e.preventDefault(); showAllIssuesModal(); });
  document.getElementById('creatorsLink')?.addEventListener('click', (e) => { e.preventDefault(); document.querySelector('#topCreators').scrollIntoView({ behavior: 'smooth' }); });
  document.getElementById('userIcon')?.addEventListener('click', () => { window.location.href = 'auth.html'; });
  document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value;
    if (email) alert(`ස්තුතියි! ${email} ලිපිනයට දැනුම්දීම් එවනු ඇත.`);
    else alert('කරුණාකර ඊමේල් ලිපිනයක් ඇතුළත් කරන්න.');
  });
});

async function loadCurrentIssue() {
  const { data: issue, error } = await supabase
    .from('issues')
    .select('*')
    .order('published_date', { ascending: false })
    .limit(1)
    .single();
  if (error || !issue) {
    document.getElementById('currentIssueContainer').innerHTML = '<div class="card" style="padding:2rem; text-align:center;">කලාපයක් නොමැත.</div>';
    return;
  }
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('issue_id', issue.id)
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false });
  renderCurrentIssue(issue, articles || []);
}

function renderCurrentIssue(issue, articles) {
  const container = document.getElementById('currentIssueContainer');
  const articlesHtml = articles.map(art => `
    <div class="article-preview" data-id="${art.id}" style="display: flex; gap: 1rem; margin-bottom: 1rem; cursor: pointer; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
      <img src="${art.cover_image || 'https://placehold.co/80'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.5rem;">
      <div>
        <h4>${escapeHtml(art.title)}</h4>
        <p class="text-muted">${art.category || 'විද්‍යාව'}</p>
      </div>
    </div>
  `).join('');
  container.innerHTML = `
    <div class="card">
      <img src="${issue.cover_image || 'https://placehold.co/1200x400'}" style="width: 100%; height: auto; max-height: 400px; object-fit: cover;">
      <div style="padding: 1.5rem;">
        <span class="badge">වත්මන් කලාපය</span>
        <h2>${escapeHtml(issue.title)}</h2>
        <p class="text-muted">${new Date(issue.published_date).toLocaleDateString('si-LK')} | ලිපි ${articles.length}ක්</p>
      </div>
      <div style="padding: 0 1.5rem 1.5rem;">
        ${articlesHtml}
      </div>
    </div>
  `;
  document.querySelectorAll('.article-preview').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-id');
      window.location.href = `article.html?id=${id}`;
    });
  });
}

async function loadArchivePreview() {
  const { data: issues } = await supabase
    .from('issues')
    .select('*')
    .order('published_date', { ascending: false })
    .range(1, 3);
  const container = document.getElementById('archivePreview');
  if (!issues || issues.length === 0) {
    container.innerHTML = '<div class="card" style="padding:1.2rem;"><p>පෙර කලාප නොමැත.</p></div>';
    return;
  }
  const html = `
    <div class="card" style="padding: 1.2rem;">
      <h3>📚 පෙර කලාප</h3>
      <div class="archive-grid" style="margin-top: 1rem;">
        ${issues.map(issue => `
          <div class="archive-item" data-id="${issue.id}" style="cursor: pointer;">
            <img src="${issue.cover_image || 'https://placehold.co/150x100'}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 0.5rem;">
            <p style="font-weight: 500;">${escapeHtml(issue.title)}</p>
            <small class="text-muted">${new Date(issue.published_date).toLocaleDateString('si-LK')}</small>
          </div>
        `).join('')}
      </div>
      <button id="viewAllArchivesBtn" class="btn-primary" style="margin-top: 1rem;">සියලු කලාප</button>
    </div>
  `;
  container.innerHTML = html;
  document.querySelectorAll('.archive-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-id');
      window.location.href = `issue.html?id=${id}`;
    });
  });
  document.getElementById('viewAllArchivesBtn')?.addEventListener('click', showAllIssuesModal);
}

async function loadTopCreators() {
  const { data: authors } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('role', 'author')
    .limit(3);
  const container = document.getElementById('topCreators');
  if (!authors || authors.length === 0) {
    container.innerHTML = '<p>කතෘවරුන් නොමැත.</p>';
    return;
  }
  container.innerHTML = authors.map(a => `
    <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem;">
      <img src="${a.avatar_url || 'https://placehold.co/40'}" style="width: 40px; height: 40px; border-radius: 50%;">
      <div><strong>${escapeHtml(a.display_name)}</strong></div>
    </div>
  `).join('');
}

async function showAllIssuesModal() {
  const { data: issues } = await supabase.from('issues').select('*').order('published_date', { ascending: false });
  if (!issues || issues.length === 0) {
    alert('කලාප නොමැත.');
    return;
  }
  let msg = 'සියලු කලාප:\n';
  issues.forEach(i => msg += `${i.title} - ${new Date(i.published_date).toLocaleDateString()}\n`);
  alert(msg);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}
