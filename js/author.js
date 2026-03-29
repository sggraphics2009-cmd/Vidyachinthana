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

  const user = await requireAuth();
  if (!user) return;

  await loadMyArticles(user.id);

  const form = document.getElementById('submitArticleForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const category = document.getElementById('category').value;
    const coverFile = document.getElementById('coverImage').files[0];

    if (!title || !content) {
      alert('කරුණාකර මාතෘකාව සහ අන්තර්ගතය පුරවන්න.');
      return;
    }

    let coverUrl = null;
    if (coverFile) {
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(`articles/${fileName}`, coverFile);
      if (uploadError) {
        alert('රූපය උඩුගත කිරීම අසාර්ථකයි: ' + uploadError.message);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('article-images').getPublicUrl(`articles/${fileName}`);
      coverUrl = publicUrl;
    }

    const { error } = await supabase.from('articles').insert({
      title, content, cover_image: coverUrl, category,
      author_id: user.id, status: 'pending'
    });
    if (error) alert('ලිපිය ඉදිරිපත් කිරීම අසාර්ථකයි: ' + error.message);
    else {
      alert('ලිපිය සාර්ථකව ඉදිරිපත් කරන ලදී.');
      form.reset();
      await loadMyArticles(user.id);
    }
  });
});

async function loadMyArticles(userId) {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, status, submitted_at')
    .eq('author_id', userId)
    .order('submitted_at', { ascending: false });
  const container = document.getElementById('myArticles');
  if (error || !articles || articles.length === 0) {
    container.innerHTML = '<p>ඔබ තවම ලිපි ඉදිරිපත් කර නැත.</p>';
    return;
  }
  const statusMap = { pending: 'සමාලෝචනයේ', approved: 'අනුමත', rejected: 'ප්‍රතික්ෂේප කළා' };
  container.innerHTML = articles.map(art => `
    <div style="border-bottom: 1px solid var(--border); padding: 0.5rem 0;">
      <div><strong>${escapeHtml(art.title)}</strong></div>
      <div><small>${statusMap[art.status] || art.status} | ${new Date(art.submitted_at).toLocaleDateString()}</small></div>
    </div>
  `).join('');
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
