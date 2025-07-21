// script.js

// URL fixa do seu backend no Render:
const API          = 'https://phillasean-1.onrender.com/api';
const BACKEND      = 'https://phillasean-1.onrender.com';
const authTokenKey = 'phil_token';

// ———————— Helpers de API ————————
async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem(authTokenKey);
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(API + path, { ...opts, headers });
  if (res.status === 401) {
    logout();
    updateAccountMenu();
    throw new Error('Não autenticado');
  }
  return res.json();
}

// ———————— Controle do dropdown “Conta” ————————
function updateAccountMenu() {
  const token = !!localStorage.getItem(authTokenKey);

  // Links para visitante (guest)
  document.querySelectorAll('#accountMenu .guest')
    .forEach(el => el.style.display = token ? 'none' : '');

  // Links para usuário autenticado (user)
  document.querySelectorAll('#accountMenu .user')
    .forEach(el => el.style.display = token ? '' : 'none');
}

// ———————— Modal de autenticação ————————
function toggleAuth(mode) {
  const modal        = document.getElementById('authModal');
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (!mode) {
    modal.style.display = 'none';
    return;
  }
  modal.style.display        = 'block';
  loginForm.style.display    = mode === 'login' ? '' : 'none';
  registerForm.style.display = mode === 'register' ? '' : 'none';
}

// ———————— Login / Logout ————————
function logout() {
  localStorage.removeItem(authTokenKey);
  updateAccountMenu();
}

document.getElementById('loginBtn').onclick    = () => toggleAuth('login');
document.getElementById('registerBtn').onclick = () => toggleAuth('register');
document.getElementById('authClose').onclick   = () => toggleAuth();

document.getElementById('loginSubmit').onclick = async () => {
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

document.getElementById('registerSubmit').onclick = async () => {
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
    alert('Falha no registro: ' + err.message);
  }
};

// Link para área do cliente
document.getElementById('clientAreaBtn').onclick = () => {
  window.location.href = 'reserva.html';
};

// ———————— Inicialização do menu ————————
updateAccountMenu();


// ———————— Reservas / Pedidos ————————
if (document.getElementById('orderForm')) {
  document.getElementById('orderForm').onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    // Se for <select multiple>, FormData já retorna array; se textarea, converte
    data.services = Array.isArray(data.services)
      ? data.services
      : data.services.split(',').map(s => s.trim());

    try {
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      alert('Reserva criada com sucesso!');
      listOrders();
      e.target.reset();
    } catch (err) {
      alert('Erro ao criar reserva: ' + err.message);
    }
  };
  listOrders();
}

async function listOrders() {
  let orders = [];
  try {
    orders = await apiFetch('/orders', { method: 'GET' });
  } catch {
    return;
  }

  // Para reserva.html (#historyTable)…
  const historyTbody = document.querySelector('#historyTable tbody');
  if (historyTbody) {
    historyTbody.innerHTML = orders.map(o =>
      `<tr>
         <td>${new Date(o.createdAt).toLocaleDateString()}</td>
         <td>${o.services.join(', ')}</td>
         <td>${o.status}</td>
         <td>
           <a href="${BACKEND}/invoices/${o.invoice.filename}" download>📄 Fatura</a>
         </td>
       </tr>`
    ).join('');
  }

  // Para index.html (#orderList)…
  const orderListDiv = document.getElementById('orderList');
  if (orderListDiv) {
    orderListDiv.innerHTML = orders.map(o =>
      `<div class="card">
         <h3>Reserva ${o._id}</h3>
         <p>Status: ${o.status}</p>
         <a href="${BACKEND}/invoices/${o.invoice.filename}" download>Download Factura</a>
       </div>`
    ).join('');
  }
}
