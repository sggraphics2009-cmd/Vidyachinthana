document.addEventListener('DOMContentLoaded', () => {
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

  const loginTab = document.getElementById('loginTabBtn');
  const registerTab = document.getElementById('registerTabBtn');
  const loginDiv = document.getElementById('loginForm');
  const registerDiv = document.getElementById('registerForm');
  loginTab.addEventListener('click', () => { loginDiv.style.display = 'block'; registerDiv.style.display = 'none'; });
  registerTab.addEventListener('click', () => { loginDiv.style.display = 'none'; registerDiv.style.display = 'block'; });

  document.getElementById('signinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert('පිවිසීම අසාර්ථකයි: ' + error.message);
    else window.location.href = 'index.html';
  });

  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const isFirst = count === 0;
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    if (error) alert('ලියාපදිංචිය අසාර්ථකයි: ' + error.message);
    else {
      const role = isFirst ? 'admin' : 'author';
      await supabase.from('users').insert({ id: data.user.id, email, display_name: name, role });
      alert(isFirst ? 'පළමු පරිශීලකයා ලෙස පරිපාලක ගිණුම සාදන ලදී. පිවිසෙන්න.' : 'ලියාපදිංචිය සාර්ථකයි! පිවිසෙන්න.');
      loginTab.click();
      e.target.reset();
    }
  });
});