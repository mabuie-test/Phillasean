// script.js

// ── Config ────────────────────────────────────────────────────────────────
const API          = 'https://phillasean-1.onrender.com/api';
const BACKEND      = 'https://phillasean-1.onrender.com';
const authTokenKey = 'phil_token';

// ── Helpers de API ────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem(authTokenKey);
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(API + path, { ...opts, headers });
  if (res.status === 401) {
    logout();
    throw new Error('Não autenticado');
  }
  return res.json();
}

// ── Mobile Menu Toggle ────────────────────────────────────────────────────
const mobileBtn = document.getElementById('mobileMenuBtn');
const mainMenu  = document.getElementById('main-menu');
if (mobileBtn && mainMenu) {
  mobileBtn.addEventListener('click', () => {
    mainMenu.classList.toggle('show');
  });
}

// ── Dropdown “Conta” ──────────────────────────────────────────────────────
const accountBtn  = document.getElementById('accountBtn');
const accountMenu = document.getElementById('accountMenu');
function updateAccountMenu() {
  const logged = !!localStorage.getItem(authTokenKey);
  document.querySelectorAll('#accountMenu .guest')
    .forEach(el => el.style.display = logged ? 'none' : '');
  document.querySelectorAll('#accountMenu .user')
    .forEach(el => el.style.display = logged ? '' : 'none');
}
if (accountBtn && accountMenu) {
  accountBtn.addEventListener('click', e => {
    e.preventDefault();
    accountMenu.classList.toggle('show');
    updateAccountMenu();
  });
  document.addEventListener('click', e => {
    if (!accountMenu.contains(e.target) && e.target !== accountBtn) {
      accountMenu.classList.remove('show');
    }
  });
  updateAccountMenu();
}

// ── Logout ────────────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem(authTokenKey);
  updateAccountMenu();
}

// ── Página de Login (login.html) ─────────────────────────────────────────
const loginPageForm = document.getElementById('loginFormPage');
if (loginPageForm) {
  loginPageForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmailPage').value;
    const pass  = document.getElementById('loginPasswordPage').value;
    try {
      const { token } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass })
      });
      localStorage.setItem(authTokenKey, token);
      window.location.href = 'reserva.html';
    } catch (err) {
      alert('Login falhou: ' + err.message);
    }
  });
}

// ── Página de Registo (register.html) ────────────────────────────────────
const registerPageForm = document.getElementById('registerFormPage');
if (registerPageForm) {
  registerPageForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('regNamePage').value;
    const email= document.getElementById('regEmailPage').value;
    const pass = document.getElementById('regPasswordPage').value;
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: pass })
      });
      alert('Registo efetuado! Faça login.');
      window.location.href = 'login.html';
    } catch (err) {
      alert('Registo falhou: ' + err.message);
    }
  });
}

// ── Modal de Autênticação (index.html) ───────────────────────────────────
const authModal     = document.getElementById('authModal');
const modalCloseBtn = document.getElementById('authClose');
const loginBtn      = document.getElementById('loginBtn');
const registerBtn   = document.getElementById('registerBtn');
const loginSubmit   = document.getElementById('loginSubmit');
const registerSubmit= document.getElementById('registerSubmit');
if (authModal) {
  function toggleAuth(mode) {
    authModal.style.display = mode ? 'flex' : 'none';
    document.getElementById('loginForm').style.display    = mode==='login'    ? 'block' : 'none';
    document.getElementById('registerForm').style.display = mode==='register' ? 'block' : 'none';
  }
  loginBtn.onclick    = () => toggleAuth('login');
  registerBtn.onclick = () => toggleAuth('register');
  modalCloseBtn.onclick = () => toggleAuth();
  loginSubmit.onclick = async () => {
    const email    = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
      const { token } = await apiFetch('/auth/login', {
        method:'POST', body: JSON.stringify({ email, password })
      });
      localStorage.setItem(authTokenKey, token);
      toggleAuth();
      updateAccountMenu();
    } catch (err) {
      alert('Falha no login: ' + err.message);
    }
  };
  registerSubmit.onclick = async () => {
    const name     = document.getElementById('regName').value;
    const email    = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    try {
      await apiFetch('/auth/register', {
        method:'POST', body: JSON.stringify({ name, email, password })
      });
      alert('Registrado com sucesso! Faça login.');
      toggleAuth('login');
    } catch (err) {
      alert('Falha no registo: ' + err.message);
    }
  };
}

// ── Reservas / Pedidos (reserva.html) ────────────────────────────────────
const orderForm = document.getElementById('orderForm');
if (orderForm) {
  orderForm.onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(orderForm));
    data.services = data.services.split(',').map(s => s.trim());
    try {
      await apiFetch('/orders', {
        method:'POST', body: JSON.stringify(data)
      });
      alert('Reserva criada com sucesso!');
      listOrders();
      orderForm.reset();
    } catch (err) {
      alert('Erro ao criar reserva: ' + err.message);
    }
  };
  listOrders();
}

async function listOrders() {
  let orders = [];
  try { orders = await apiFetch('/orders', { method:'GET' }); }
  catch { return; }
  const tb = document.querySelector('#historyTable tbody');
  if (tb) {
    tb.innerHTML = orders.map(o =>
      `<tr>
         <td>${new Date(o.createdAt).toLocaleDateString()}</td>
         <td>${o.services.join(', ')}</td>
         <td>${o.status}</td>
         <td><a href="${BACKEND}/invoices/${o.invoice.filename}" download>📄 Fatura</a></td>
       </tr>`
    ).join('');
  }
}

// ── Fim do script ────────────────────────────────────────────────────────
