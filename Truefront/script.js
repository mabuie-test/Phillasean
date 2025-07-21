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
  const json = await res.json();
  if (!res.ok) {
    // json.message vem do backend (controllers)
    throw new Error(json.message || 'Erro na requisição');
  }
  return json;
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
    const name  = document.getElementById('regNamePage').value;
    const email = document.getElementById('regEmailPage').value;
    const pass  = document.getElementById('regPasswordPage').value;
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
const authModal      = document.getElementById('authModal');
const modalCloseBtn  = document.getElementById('authClose');
const modalLoginBtn  = document.getElementById('loginBtn');
const modalRegBtn    = document.getElementById('registerBtn');
const modalLoginSub  = document.getElementById('loginSubmit');
const modalRegSub    = document.getElementById('registerSubmit');

if (authModal) {
  function toggleAuth(mode) {
    authModal.style.display = mode ? 'flex' : 'none';
    document.getElementById('loginForm').style.display    = mode === 'login'    ? 'block' : 'none';
    document.getElementById('registerForm').style.display = mode === 'register' ? 'block' : 'none';
  }
  modalLoginBtn.onclick   = () => toggleAuth('login');
  modalRegBtn.onclick     = () => toggleAuth('register');
  modalCloseBtn.onclick   = () => toggleAuth();
  modalLoginSub.onclick   = async () => {
    const email    = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
      const { token } = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem(authTokenKey, token);
      toggleAuth();
      updateAccountMenu();
    } catch (err) {
      alert('Falha no login: ' + err.message);
    }
  };
  modalRegSub.onclick     = async () => {
    const name     = document.getElementById('regName').value;
    const email    = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
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
  orderForm.addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
      name:     orderForm.elements.name.value,
      company:  orderForm.elements.company.value,
      email:    orderForm.elements.email.value,
      phone:    orderForm.elements.phone.value,
      vessel:   orderForm.elements.vessel.value,
      port:     orderForm.elements.port.value,
      date:     orderForm.elements.date.value,
      services: Array.from(orderForm.elements.services.selectedOptions).map(o => o.value),
      notes:    orderForm.elements.notes.value
    };

    try {
      const created = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      alert(`Reserva criada com sucesso! ID: ${created._id}`);
      orderForm.reset();
      listOrders();
    } catch (err) {
      console.error('Erro ao criar reserva:', err);
      alert(`Não foi possível criar a reserva: ${err.message}`);
    }
  });

  listOrders();
}

async function listOrders() {
  try {
    const orders = await apiFetch('/orders', { method: 'GET' });
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
  } catch (err) {
    console.error('Erro ao listar reservas:', err);
  }
}

// ── Fim do script ────────────────────────────────────────────────────────//
