// script.js

// URL fixa do seu backend no Render:
const API = 'https://phillasean-1.onrender.com/api';
const BACKEND = 'https://phillasean-1.onrender.com';
const authTokenKey = 'phil_token';

// Helper para chamadas à API com JWT
async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem(authTokenKey);
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(API + path, { ...opts, headers });
  if (res.status === 401) logout();
  return res.json();
}

// ================= Autenticação =================
function updateNav() {
  const token = localStorage.getItem(authTokenKey);
  document.getElementById('loginBtn').style.display    = token ? 'none' : '';
  document.getElementById('registerBtn').style.display = token ? 'none' : '';
  document.getElementById('logoutBtn').style.display   = token ? '' : 'none';
}
function logout() {
  localStorage.removeItem(authTokenKey);
  updateNav();
}
function toggleAuth(mode) {
  const modal = document.getElementById('authModal');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (!mode) return modal.style.display = 'none';
  modal.style.display = 'block';
  loginForm.style.display    = mode === 'login' ? '' : 'none';
  registerForm.style.display = mode === 'register' ? '' : 'none';
}

document.getElementById('loginBtn').onclick    = () => toggleAuth('login');
document.getElementById('registerBtn').onclick = () => toggleAuth('register');
document.getElementById('authClose').onclick   = () => toggleAuth();
document.getElementById('loginSubmit').onclick = async () => {
  const email    = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const { token } = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  localStorage.setItem(authTokenKey, token);
  toggleAuth();
  updateNav();
};
document.getElementById('registerSubmit').onclick = async () => {
  const name     = document.getElementById('regName').value;
  const email    = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  alert('Registrado! Faça login.');
  toggleAuth('login');
};
updateNav();

// ================= Reservas / Pedidos =================
if (document.getElementById('orderForm')) {
  document.getElementById('orderForm').onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.services = Array.isArray(data.services)
      ? data.services
      : data.services.split(',').map(s => s.trim());
    await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    alert('Reserva criada com sucesso!');
    listOrders();
    e.target.reset();
  };
  listOrders();
}

async function listOrders() {
  const orders = await apiFetch('/orders', { method: 'GET' });
  // Se você tiver #historyTable (reserva.html) ou #orderList (index.html), atualize ambos:
  const historyTbody = document.querySelector('#historyTable tbody');
  const orderListDiv = document.getElementById('orderList');

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
