// Base da sua API
const API_BASE = 'https://phillaseanbackend.onrender.com';
const API      = API_BASE + '/api';

// Fetch genérico com JWT
async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res  = await fetch(API + path, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

// Atualiza Navbar conforme auth
function updateNav() {
  const user = JSON.parse(localStorage.getItem('user'));
  const nav  = document.getElementById('nav-list');
  if (user) {
    nav.innerHTML = `
      <li>Olá, ${user.name}</li>
      <li><a href="client-portal.html?userId=${user._id}">Portal do Cliente</a></li>
      <li><button id="btn-logout">Logout</button></li>
    `;
    document.getElementById('btn-logout').onclick = () => {
      localStorage.clear();
      updateNav();
    };
  } else {
    nav.innerHTML = `
      <li><button id="btn-login-nav">Login</button></li>
      <li><button id="btn-register-nav">Registrar</button></li>
    `;
    document.getElementById('btn-login-nav').onclick    = () => openAuth('login');
    document.getElementById('btn-register-nav').onclick = () => openAuth('register');
  }
}

// Abre modal de auth e seleciona aba
function openAuth(tab) {
  document.getElementById('auth-modal').classList.remove('hidden');
  document.getElementById('tab-login').classList.toggle('active',    tab==='login');
  document.getElementById('tab-register').classList.toggle('active', tab==='register');
  document.getElementById('form-login').classList.toggle('active',   tab==='login');
  document.getElementById('form-register').classList.toggle('active',tab==='register');
}

// Fecha modal
document.getElementById('auth-close').onclick = () => {
  document.getElementById('auth-modal').classList.add('hidden');
};

// Troca abas manualmente
document.getElementById('tab-login').onclick    = () => openAuth('login');
document.getElementById('tab-register').onclick = () => openAuth('register');

// **Login**
document.getElementById('form-login').onsubmit = async e => {
  e.preventDefault();
  try {
    const email = e.target['login-email'].value.trim();
    const pwd   = e.target['login-password'].value;
    const res   = await apiFetch('/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password: pwd })
    });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user',  JSON.stringify(res.user));
    updateNav();
    document.getElementById('auth-modal').classList.add('hidden');
  } catch (err) {
    alert(err.message);
  }
};

// **Registro**
document.getElementById('form-register').onsubmit = async e => {
  e.preventDefault();
  try {
    const name  = e.target['reg-name'].value.trim();
    const email = e.target['reg-email'].value.trim();
    const pwd   = e.target['reg-password'].value;
    await apiFetch('/auth/register', {
      method: 'POST',
      body:   JSON.stringify({ name, email, password: pwd })
    });
    alert('Registro ok! Agora faça login.');
    openAuth('login');
  } catch (err) {
    alert(err.message);
  }
};

// **Solicitar via cartões** (sem formulário extra)
document.querySelectorAll('.request-btn').forEach(btn => {
  btn.onclick = async () => {
    try {
      const service = btn.dataset.service;
      const name    = prompt('Seu nome completo:');
      const email   = prompt('Seu email:');
      if (!name || !email) throw new Error('Nome e email são obrigatórios.');
      await apiFetch('/orders', {
        method: 'POST',
        body:   JSON.stringify({ name, email, service })
      });
      alert('Pedido enviado com sucesso!');
    } catch (err) {
      alert(err.message);
    }
  };
});

// **Formulário completo de pedido**
document.getElementById('order-form').onsubmit = async e => {
  e.preventDefault();
  try {
    const name    = e.target['order-name'].value.trim();
    const email   = e.target['order-email'].value.trim();
    const service = e.target['order-service'].value;
    const details = e.target['order-details'].value.trim();
    await apiFetch('/orders', {
      method: 'POST',
      body:   JSON.stringify({ name, email, service, details })
    });
    document.getElementById('order-msg').textContent = 'Solicitação enviada!';
    e.target.reset();
  } catch (err) {
    document.getElementById('order-msg').textContent = err.message;
  }
};

// Inicialização
updateNav();
