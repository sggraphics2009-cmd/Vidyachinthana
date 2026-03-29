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

  const admin = await requireAdmin();
  if (!admin) return;

  await loadPendingArticles();
  await loadAllApprovedArticles();
  await loadUsers();

  const form = document.getElementById('createIssueForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('issueTitle').value;
    const date = document.getElementById('issueDate').value;
    const coverFile = document.getElementById('issueCover').files[0];
    const selectedArticleIds = Array.from(document.querySelectorAll('input[name="articleForIssue"]:checked')).map(cb => cb.value);

    if (!title || !date || selectedArticleIds.length === 0) {
      alert('කරුණාකර කලාපයේ මාතෘකාව, දිනය සහ අවම වශයෙන් එක් ලිපියක් තෝරන්න.');
      return;
    }

    let coverUrl = null;
    if (coverFile) {
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('covers')
        .upload(`issues/${fileName}`, coverFile);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(`issues/${fileName}`);
        coverUrl = publicUrl;
      }
    }

    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({ title, cover_image: coverUrl, published_date: date })
      .select()
      .single();
    if (issueError) {
      alert('කලාපය සෑදීම අසාර්ථකයි: ' + issueError.message);
      return;
    }

    const { error: updateError } = await supabase
      .from('articles')
      .update({ issue_id: issue.id, status: 'approved', approved_at: new Date().toISOString() })
      .in('id', selectedArticleIds);
    if (updateError) alert('ලිපි යාවත්කාලීන කිරීම අසාර්ථකයි: ' + updateError.message);
    else {
      alert(`කලාපය "${title}" සාර්ථකව ප්‍රකාශයට පත් කරන ලදී.`);
      form.reset();
      await loadPendingArticles();
      await loadAllApprovedArticles();
    }
  });
});

async function loadPendingArticles() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, author_id, submitted_at, author:author_id(display_name)')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });
  const container = document.getElementById('pendingArticles');
  if (error || !articles || articles.length === 0) {
    container.innerHTML = '<p>සමාලෝචනයට ලිපි නොමැත.</p>';
    return;
  }
  container.innerHTML = articles.map(art => `
    <div style="border-bottom: 1px solid var(--border); padding: 0.8rem 0;">
      <div><strong>${escapeHtml(art.title)}</strong></div>
      <div><small>කතෘ: ${art.author?.display_name || 'නොදනී'} | ${new Date(art.submitted_at).toLocaleDateString()}</small></div>
      <div style="margin-top: 0.5rem;">
        <button class="btn-primary btn-small" data-id="${art.id}" data-action="approve">අනුමත කරන්න</button>
        <button class="btn-outline btn-small" data-id="${art.id}" data-action="reject">ප්‍රතික්ෂේප කරන්න</button>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('[data-action="approve"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await supabase.from('articles').update({ status: 'approved' }).eq('id', id);
      await loadPendingArticles();
    });
  });
  document.querySelectorAll('[data-action="reject"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await supabase.from('articles').update({ status: 'rejected' }).eq('id', id);
      await loadPendingArticles();
    });
  });
}

async function loadAllApprovedArticles() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, author:author_id(display_name)')
    .eq('status', 'approved')
    .is('issue_id', null)
    .order('submitted_at', { ascending: false });
  const container = document.getElementById('articlesForIssue');
  if (error || !articles || articles.length === 0) {
    container.innerHTML = '<p>කලාපයකට එකතු කළ හැකි අනුමත ලිපි නොමැත.</p>';
    return;
  }
  container.innerHTML = articles.map(art => `
    <div><label><input type="checkbox" name="articleForIssue" value="${art.id}"> ${escapeHtml(art.title)} (${art.author?.display_name || 'නොදනී'})</label></div>
  `).join('');
}

async function loadUsers() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, display_name, role')
    .order('created_at', { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  const currentUser = await getCurrentUser();
  const container = document.getElementById('userList');
  if (!users || users.length === 0) {
    container.innerHTML = '<p>පරිශීලකයන් නොමැත.</p>';
    return;
  }
  container.innerHTML = `
    <table style="width:100%; border-collapse: collapse;">
      <thead><tr style="border-bottom:1px solid var(--border);"><th>නම</th><th>විද්‍යුත් ලිපිනය</th><th>භූමිකාව</th><th>ක්‍රියාව</th></tr></thead>
      <tbody>
        ${users.map(user => `
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:0.5rem;">${escapeHtml(user.display_name)}</td>
            <td style="padding:0.5rem;">${escapeHtml(user.email)}</td>
            <td style="padding:0.5rem;">${user.role === 'admin' ? 'පරිපාලක' : 'කතෘ'}</td>
            <td style="padding:0.5rem;">
              ${user.id !== currentUser.id ? `<button class="btn-outline btn-small" data-user-id="${user.id}" data-current-role="${user.role}">${user.role === 'admin' ? 'කතෘ කරන්න' : 'පරිපාලක කරන්න'}</button>` : '(ඔබ)'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  document.querySelectorAll('[data-user-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.getAttribute('data-user-id');
      const currentRole = btn.getAttribute('data-current-role');
      const newRole = currentRole === 'admin' ? 'author' : 'admin';
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
      if (error) alert('භූමිකාව වෙනස් කිරීම අසාර්ථකයි: ' + error.message);
      else {
        alert('භූමිකාව සාර්ථකව වෙනස් කරන ලදී.');
        await loadUsers();
      }
    });
  });
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
