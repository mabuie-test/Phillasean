// script.js

const API_BASE = 'https://phillaseanbackend.onrender.com';  // URL do backend no Render
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
    window.location.href = 'login.html';
    return;
  }
  return await res.json();
}

// Registro de cliente
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
    console.log('resp POST /api/auth/register:', json);
    if (json.token) {
      localStorage.setItem(authTokenKey, json.token);
      window.location.href = 'reserva.html';
    } else {
      alert(json.error || 'Erro no registro');
    }
  });
}

// Login (cliente ou admin)
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
    console.log('resp POST /api/auth/login:', json);
    if (!json.token) {
      return alert(json.error || 'Erro no login');
    }
    localStorage.setItem(authTokenKey, json.token);

    let role = json.role;
    if (!role) {
      try {
        const payload = JSON.parse(atob(json.token.split('.')[1]));
        role = payload.role;
      } catch {
        console.warn('Não foi possível extrair role do token');
      }
    }

    if (role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'reserva.html';
    }
  });
}

// Envio de pedido (só para clientes)
const orderForm = document.getElementById('orderForm');
if (orderForm) {
  orderForm.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const f = new FormData(orderForm);
      const body = {
        name:     f.get('name'),
        company:  f.get('company'),
        email:    f.get('email'),
        phone:    f.get('phone'),
        vessel:   f.get('vessel'),
        port:     f.get('port'),
        date:     f.get('date'),
        services: f.getAll('services'),  // array de strings
        notes:    f.get('notes')
      };
      console.log('POST /api/orders', body);
      const json = await api('/api/orders', { method: 'POST', body });
      console.log('resp POST /api/orders:', json);
      if (json.success) {
        alert(`Pedido enviado! Referência: ${json.reference}`);
        orderForm.reset();
        loadOrderHistory();
      } else {
        alert(json.error || 'Erro ao enviar pedido');
      }
    } catch (err) {
      console.error('Erro inesperado no envio de pedido:', err);
      alert('Erro inesperado ao enviar pedido. Veja o console.');
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

// Histórico de Pedidos com download de PDF
async function loadOrderHistory() {
  try {
    console.log('GET /api/orders');
    const history = await api('/api/orders', { method: 'GET' });
    console.log('resp GET /api/orders:', history);
    const tbody = document.querySelector('#historyTable tbody');
    if (!tbody || history.error) return;

    tbody.innerHTML = '';
    history.forEach(o => {
      // monta lista de serviços
      const servicesHtml = Array.isArray(o.services)
        ? `<ul>${o.services.map(s => `<li>${s}</li>`).join('')}</ul>`
        : o.service;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
        <td>${servicesHtml}</td>
        <td>${o.status}</td>
        <td>${
          o.reference
            ? `<button class="btn download-btn" data-id="${o.id}" data-ref="${o.reference}">Baixar PDF</button>`
            : '—'
        }</td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.download-btn').forEach(btn => {
      btn.onclick = async () => {
        const id  = btn.dataset.id;
        const ref = btn.dataset.ref;
        try {
          console.log(`GET /api/orders/${id}/invoice`);
          const res = await fetch(`${API_BASE}/api/orders/${id}/invoice`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem(authTokenKey) }
          });
          if (!res.ok) {
            const err = await res.json();
            return alert(err.error || 'Erro ao baixar factura');
          }
          const blob = await res.blob();
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href     = url;
          a.download = `factura-${ref}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('Erro no download da factura:', e);
          alert('Falha ao baixar factura');
        }
      };
    });
  } catch (err) {
    console.error('Falha ao carregar histórico:', err);
  }
}

// Carrega histórico ao abrir a página de reservas
if (document.getElementById('historyTable')) {
  loadOrderHistory();
}
