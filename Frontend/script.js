// script.js

const API_BASE = 'https://phillaseanbackend.onrender.com';  // URL do seu backend no Render
const authTokenKey = 'phil_token';

// Helper para chamadas à API
async function api(path, opts = {}) {
  const headers = opts.headers || {};
  const token = localStorage.getItem(authTokenKey);
  if (token) headers['Authorization'] = 'Bearer ' + token;
  headers['Content-Type'] = 'application/json';

  const res = await fetch(API_BASE + path, {
    ...opts,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  if (res.status === 401) {
    // Não autorizado, redireciona para login
    window.location.href = 'login.html';
    return;
  }
  return await res.json();
}

// Registro
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(registerForm);
    const body = {
      name:     f.get('name'),
      email:    f.get('email'),
      password: f.get('password')
    };
    const json = await api('/api/auth/register', { method: 'POST', body });
    if (json.token) {
      localStorage.setItem(authTokenKey, json.token);
      window.location.href = 'reserva.html';
    } else {
      alert(json.error || 'Erro no registro');
    }
  });
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(loginForm);
    const body = {
      email:    f.get('email'),
      password: f.get('password')
    };
    const json = await api('/api/auth/login', { method: 'POST', body });
    if (json.token) {
      localStorage.setItem(authTokenKey, json.token);
      window.location.href = 'reserva.html';
    } else {
      alert(json.error || 'Erro no login');
    }
  });
}

// Envio de pedido
const orderForm = document.getElementById('orderForm');
if (orderForm) {
  orderForm.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(orderForm);
    const body = {
      name:      f.get('name'),
      company:   f.get('company'),
      email:     f.get('email'),
      phone:     f.get('phone'),
      vessel:    f.get('vessel'),
      port:      f.get('port'),
      date:      f.get('date'),
      service:   f.get('service'),
      quantity:  parseInt(f.get('quantity'), 10),
      unitPrice: parseFloat(f.get('unitPrice') || 0),
      notes:     f.get('notes')
    };
    const json = await api('/api/orders', { method: 'POST', body });
    if (json.success) {
      alert(`Pedido enviado! Referência: ${json.reference}`);
      orderForm.reset();
      // recarrega histórico após novo pedido
      if (typeof loadOrderHistory === 'function') loadOrderHistory();
    } else {
      alert(json.error || 'Erro ao enviar pedido');
    }
  });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(authTokenKey);
    window.location.href = 'login.html';
  });
}

// --- Histórico de Pedidos ---
async function loadOrderHistory() {
  const history = await api('/api/orders', { method: 'GET' });
  if (!history || history.error) return;
  const tbody = document.querySelector('#historyTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  history.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      <td>${o.service}</td>
      <td>${o.quantity}</td>
      <td>${o.status}</td>
      <td>${
        o.reference
          ? `<a href="${API_BASE}/api/orders/${o.id}/invoice" target="_blank">Baixar</a>`
          : '—'
      }</td>
    `;
    tbody.appendChild(tr);
  });
}

// Se estiver na página de reservas, carrega o histórico ao iniciar
if (document.getElementById('historyTable')) {
  loadOrderHistory();
}
