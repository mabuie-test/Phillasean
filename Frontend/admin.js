console.log('⚙️ admin.js carregado');

const API_BASE = 'https://phillaseanbackend.onrender.com';
const authTokenKey = 'phil_token';

const auditList = document.getElementById('auditList');
const tbody = document.querySelector('#adminTable tbody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn = document.getElementById('refreshBtn');
const createAdminForm = document.getElementById('createAdminForm');
const adminList = document.getElementById('adminList');

// --- Helper de API
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

// --- Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem(authTokenKey);
  window.location.href = 'login.html';
});

// --- Carregar Pedidos (com múltiplos serviços)
async function loadAdminOrders() {
  const orders = await api('/api/admin/orders', { method: 'GET' });
  if (!Array.isArray(orders)) return;

  let filtered = statusFilter.value
    ? orders.filter(o => o.status === statusFilter.value)
    : [...orders];

  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(o =>
      (o.client.name || '').toLowerCase().includes(q) ||
      (o.client.email || '').toLowerCase().includes(q) ||
      (o.details?.services || []).some(s => s.toLowerCase().includes(q)) ||
      (o.reference || '').toLowerCase().includes(q)
    );
  }

  tbody.innerHTML = '';
  filtered.forEach(o => {
    const servicesHtml = Array.isArray(o.details?.services)
      ? `<ul>${o.details.services.map(s => `<li>${s}</li>`).join('')}</ul>`
      : '—';

    const histHtml = (o.history || []).map(h =>
      `<li>${new Date(h.changedAt).toLocaleDateString()} — ${h.status} (${h.by})</li>`
    ).join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o._id}</td>
      <td>${o.client.name}<br><small>${o.client.email}</small></td>
      <td>${servicesHtml}</td>
      <td class="status-cell ${o.status}">${o.status.replace('_', ' ')}</td>
      <td><ul class="history-list">${histHtml}</ul></td>
      <td>
        <button class="btn btn-download" data-order-id="${o._id}" data-ref="${o.reference}">
          PDF
        </button>
      </td>
      <td>
        <select class="status-select" data-order-id="${o._id}">
          <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pendente</option>
          <option value="in_progress" ${o.status === 'in_progress' ? 'selected' : ''}>Em Progresso</option>
          <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Concluído</option>
        </select>
        <button class="btn btn-update" data-order-id="${o._id}">OK</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachOrderListeners();
}

// --- Atualizar status + baixar PDF
function attachOrderListeners() {
  tbody.querySelectorAll('.btn-update').forEach(btn => {
    btn.onclick = async () => {
      const orderId = btn.dataset.orderId;
      const status = document.querySelector(`.status-select[data-order-id="${orderId}"]`).value;
      const resp = await api(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        body: { status }
      });
      if (resp?.success) {
        alert('Status atualizado');
        loadAdminOrders();
      } else {
        alert(resp?.error || 'Erro ao atualizar status');
      }
    };
  });

  tbody.querySelectorAll('.btn-download').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.orderId;
      const ref = btn.dataset.ref;
      try {
        const res = await fetch(`${API_BASE}/api/orders/${id}/invoice`, {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem(authTokenKey) }
        });
        if (!res.ok) {
          const err = await res.json();
          return alert(err.error || 'Erro ao baixar factura');
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${ref}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (e) {
        alert('Erro ao baixar factura');
      }
    };
  });
}

// --- Gestão de Administradores
async function loadAdmins() {
  const admins = await api('/api/admin/users', { method: 'GET' });
  if (!Array.isArray(admins)) return;
  adminList.innerHTML = '';
  admins.forEach(a => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${a.name} (${a.email})
      <button class="btn btn-delete-admin" data-admin-id="${a._id}">Excluir</button>
    `;
    adminList.appendChild(li);
  });
  attachAdminListeners();
}

function attachAdminListeners() {
  document.querySelectorAll('.btn-delete-admin').forEach(btn => {
    btn.onclick = async () => {
      const adminId = btn.dataset.adminId;
      if (!confirm('Remover este administrador?')) return;
      const resp = await api(`/api/admin/users/${adminId}`, { method: 'DELETE' });
      if (resp?.success) {
        alert('Administrador removido');
        loadAdmins();
      } else {
        alert(resp?.error || 'Erro ao remover');
      }
    };
  });
}

createAdminForm.addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(createAdminForm);
  const body = {
    name: f.get('name'),
    email: f.get('email'),
    password: f.get('password'),
    secret: f.get('secret')
  };
  const resp = await api('/api/admin/users', { method: 'POST', body });
  if (resp?.success) {
    alert('Administrador criado');
    createAdminForm.reset();
    loadAdmins();
  } else {
    alert(resp?.error || 'Erro ao criar');
  }
});

// --- Auditoria
async function loadAuditLog() {
  const logs = await api('/api/admin/audit', { method: 'GET' });
  if (!Array.isArray(logs)) return;
  auditList.innerHTML = '';
  logs.forEach(l => {
    const li = document.createElement('li');
    const time = new Date(l.timestamp).toLocaleString();
    const admin = l.admin ? `${l.admin.name} (${l.admin.email})` : '—';
    const target = l.target ? `${l.target.name} (${l.target.email})` : '—';
    li.textContent = `${time} — ${admin} → ${l.action} → ${target}`;
    auditList.appendChild(li);
  });
}

// --- Eventos
searchInput.addEventListener('input', loadAdminOrders);
statusFilter.addEventListener('change', loadAdminOrders);
refreshBtn.addEventListener('click', loadAdminOrders);

// --- Inicialização
(async () => {
  await loadAdminOrders();
  await loadAdmins();
  await loadAuditLog();
})();
