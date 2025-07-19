// script.js

const API_BASE = ''; // se seu backend estiver no mesmo domínio, deixe vazio. Caso contrário, coloque a URL completa.
const authTokenKey = 'phil_token';

// Helper para chamar a API com JWT
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

  // Se não autenticado, redireciona para login
  if (res.status === 401) {
    window.location.href = 'login.html';
    return;
  }
  return res.json();
}

// --- Manipulação de Registro ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const form = new FormData(registerForm);
    const body = {
      name:     form.get('name'),
      email:    form.get('email'),
      password: form.get('password')
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

// --- Manipulação de Login ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const form = new FormData(loginForm);
    const body = {
      email:    form.get('email'),
      password: form.get('password')
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

// --- Envio de Pedido (reserva.html) ---
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
    } else {
      alert('Erro: ' + (json.error || 'Não foi possível enviar pedido'));
    }
  });
}

// --- Logout (se houver botão) ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(authTokenKey);
    window.location.href = 'login.html';
  });
}
