const SUPABASE_URL = 'https://your-project-id.supabase.co';   // Replace with your URL
const SUPABASE_ANON_KEY = 'your-anon-key';                   // Replace with your key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getCurrentUser() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  if (profileError) return { ...user, role: 'author' };
  return { ...user, ...profile };
}

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html';
    return null;
  }
  return user;
}

async function requireAdmin() {
  const user = await requireAuth();
  if (!user || user.role !== 'admin') {
    alert('ඔබට මෙම පිටුවට ප්‍රවේශ වීමේ අවසර නැත.');
    window.location.href = 'index.html';
    return null;
  }
  return user;
}
