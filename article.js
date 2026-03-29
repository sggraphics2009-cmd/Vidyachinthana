const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');
if (!articleId) window.location.href = 'index.html';

document.addEventListener('DOMContentLoaded', async () => {
  const themeToggle = document.getElementById('themeToggle');
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });

  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('active'));
  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) mobileMenu.classList.remove('active');
  });

  await loadArticle();
});

async function loadArticle() {
  const { data: article, error } = await supabase
    .from('articles')
    .select('*, author:author_id(display_name)')
    .eq('id', articleId)
    .single();
  if (error || !article) {
    document.getElementById('articleContent').innerHTML = '<div class="card" style="padding:2rem;"><p>ලිපිය සොයාගත නොහැක.</p></div>';
    return;
  }
  await supabase.from('articles').update({ views: (article.views || 0) + 1 }).eq('id', articleId);
  const contentHtml = marked.parse(article.content);
  document.getElementById('articleContent').innerHTML = `
    <div class="card" style="padding: 2rem;">
      <h1>${escapeHtml(article.title)}</h1>
      <div class="text-muted" style="margin-bottom: 1rem;">
        ${article.author?.display_name || 'නොදනී'} | ${article.category || 'විද්‍යාව'} | ${new Date(article.submitted_at).toLocaleDateString('si-LK')}
      </div>
      <img src="${article.cover_image || 'https://placehold.co/800x400'}" style="width: 100%; border-radius: 1rem; margin-bottom: 1.5rem;">
      <div class="article-body">${contentHtml}</div>
    </div>
  `;
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