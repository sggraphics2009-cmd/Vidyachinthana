const SUPABASE_URL = 'https://qrbqdpxyuhcxefyztdmb.supabase.co';   // Replace with your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyYnFkcHh5dWhjeGVmeXp0ZG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTU4MDcsImV4cCI6MjA5MDI5MTgwN30.5w1oC2DV9yEzA6oOWUqne5QF4Snu_Kq7vn5zneGyuK4';                   // Replace with your key

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
