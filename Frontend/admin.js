// admin.js
console.log('⚙️ admin.js carregado');

const API_BASE     = 'https://phillaseanbackend.onrender.com';
const authTokenKey = 'phil_token';

const tbody           = document.querySelector('#adminTable tbody');
const searchInput     = document.getElementById('searchInput');
const statusFilter    = document.getElementById('statusFilter');
const refreshBtn      = document.getElementById('refreshBtn');
const createAdminForm = document.getElementById('createAdminForm');
const adminList       = document.getElementById('adminList');
const auditList       = document.getElementById('auditList');

// Helper para chamar API e tratar 401
async function api(path, opts = {}) {
  const headers = opts.headers || {};
  const token = localStorage.getItem(authTokenKey);
  if (token) headers['Authorization'] = 'Bearer ' + token;
  headers['Content-Type'] = 'application/json';
  const res = await fetch(API_BASE + path, { ...opts, headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (res.status === 401) {
    return window.location.href = 'login.html';
  }
  return res.json();
}

// --- 1) Pedidos ---

async function loadAdminOrders() {
  const orders = await api('/api/admin/orders', { method: 'GET' });
  if (!Array.isArray(orders)) return;

  // Filtrar status
  let filtered = statusFilter.value
    ? orders.filter(o => o.status === statusFilter.value)
    : orders.slice();

  // Filtrar texto em cliente, email, referência ou serviços
  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(o =>
      (o.client.name || '').toLowerCase().includes(q) ||
      (o.client.email || '').toLowerCase().includes(q) ||
      (o.reference || '').toLowerCase().includes(q) ||
      (Array.isArray(o.details.services) &&
        o.details.services.some(s => s.toLowerCase().includes(q)))
    );
  }

  // Renderiza tabela
  tbody.innerHTML = '';
  filtered.forEach(o => {
    const servicesHtml = Array.isArray(o.details.services) && o.details.services.length
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
      <td class="status-cell ${o.status}">${o.status.replace('_',' ')}</td>
      <td><ul class="history-list">${histHtml}</ul></td>
      <td>
        <button class="btn btn-download" data-id="${o._id}" data-ref="${o.reference}">PDF</button>
      </td>
      <td>
        <select class="status-select" data-id="${o._id}">
          <option value="pending"    ${o.status==='pending'    ? 'selected':''}>Pendente</option>
          <option value="in_progress"${o.status==='in_progress'? 'selected':''}>Em Progresso</option>
          <option value="completed"  ${o.status==='completed'  ? 'selected':''}>Concluído</option>
        </select>
        <button class="btn btn-update" data-id="${o._id}">OK</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachOrderListeners();
}

function attachOrderListeners() {
  // Atualizar status
  tbody.querySelectorAll('.btn-update').forEach(btn => {
    btn.onclick = async () => {
      const id     = btn.dataset.id;
      const sel    = tbody.querySelector(`.status-select[data-id="${id}"]`);
      const status = sel.value;
      const resp   = await api(`/api/admin/orders/${id}`, {
        method: 'PUT', body: { status }
      });
      if (resp.success) loadAdminOrders();
      else alert(resp.error || 'Erro ao atualizar status');
    };
  });

  // Download PDF
  tbody.querySelectorAll('.btn-download').forEach(btn => {
    btn.onclick = async () => {
      const id  = btn.dataset.id;
      const ref = btn.dataset.ref;
      const res = await fetch(`${API_BASE}/api/orders/${id}/invoice`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem(authTokenKey) }
      });
      if (!res.ok) {
        const e = await res.json();
        return alert(e.error || 'Erro ao baixar factura');
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
    };
  });
}

// --- 2) Gestão de Admins ---

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
  adminList.querySelectorAll('.btn-delete-admin').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Remover este admin?')) return;
      await api(`/api/admin/users/${btn.dataset.adminId}`, { method: 'DELETE' });
      loadAdmins();
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
  if (resp.success) {
    createAdminForm.reset();
    loadAdmins();
  } else alert(resp.error || 'Erro ao criar admin');
});

// --- 3) Auditoria ---

async function loadAuditLog() {
  const logs = await api('/api/admin/audit', { method: 'GET' });
  if (!Array.isArray(logs)) return;
  auditList.innerHTML = '';
  logs.forEach(l => {
    const li = document.createElement('li');
    li.textContent = `${new Date(l.createdAt).toLocaleString()} — ${l.action} por ${l.admin.name}`;
    auditList.appendChild(li);
  });
}

// --- 4) Logout ---

document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem(authTokenKey);
  window.location.href = 'login.html';
};

// --- Inicialização ---

(async () => {
  await loadAdminOrders();
  await loadAdmins();
  await loadAuditLog();
  // filtros e refresh
  searchInput.oninput  = loadAdminOrders;
  statusFilter.onchange = loadAdminOrders;
  refreshBtn.onclick   = loadAdminOrders;
})();
