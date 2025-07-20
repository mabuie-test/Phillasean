// admin.js

console.log('⚙️ admin.js carregado');

const API_BASE     = 'https://phillaseanbackend.onrender.com';
const authTokenKey = 'phil_token';

// -----------------------
// Helper para chamadas à API
// -----------------------
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
    // Se não autorizado, volta ao login
    window.location.href = 'login.html';
    return;
  }
  return await res.json();
}

// -----------------------
// Elementos do DOM
// -----------------------
const tbody           = document.querySelector('#adminTable tbody');
const searchInput     = document.getElementById('searchInput');
const statusFilter    = document.getElementById('statusFilter');
const refreshBtn      = document.getElementById('refreshBtn');
const createAdminForm = document.getElementById('createAdminForm');
const adminList       = document.getElementById('adminList');
const auditList       = document.getElementById('auditList');

// -----------------------
// Logout
// -----------------------
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem(authTokenKey);
  window.location.href = 'login.html';
});

// -----------------------
// Carregar Pedidos
// -----------------------
async function loadAdminOrders() {
  const orders = await api('/api/admin/orders', { method: 'GET' });
  if (!Array.isArray(orders)) return console.error('Pedido inválido:', orders);

  // Aplica filtros
  let filtered = orders;
  if (statusFilter.value) {
    filtered = filtered.filter(o => o.status === statusFilter.value);
  }
  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(o =>
      (o.client.name||'').toLowerCase().includes(q) ||
      (o.client.email||'').toLowerCase().includes(q) ||
      (o.details.services||[]).some(s => s.toLowerCase().includes(q)) ||
      (o.reference||'').toLowerCase().includes(q)
    );
  }

  // Limpa tabela
  tbody.innerHTML = '';

  // Renderiza cada pedido
  filtered.forEach(o => {
    const servicesHtml = Array.isArray(o.details.services) && o.details.services.length
      ? `<ul>${o.details.services.map(s => `<li>${s}</li>`).join('')}</ul>`
      : '—';

    const histHtml = (o.history||[]).map(h =>
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
        <button class="btn btn-download" data-order-id="${o._id}" data-ref="${o.reference}">PDF</button>
      </td>
      <td>
        <select class="status-select" data-order-id="${o._id}">
          <option value="pending"    ${o.status==='pending'   ? 'selected':''}>Pendente</option>
          <option value="in_progress"${o.status==='in_progress'? 'selected':''}>Em Progresso</option>
          <option value="completed"  ${o.status==='completed' ? 'selected':''}>Concluído</option>
        </select>
        <button class="btn btn-update" data-order-id="${o._id}">OK</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachOrderListeners();
}

// -----------------------
// Listeners de Ação nos Pedidos
// -----------------------
function attachOrderListeners() {
  // Atualiza status
  tbody.querySelectorAll('.btn-update').forEach(btn => {
    btn.onclick = async () => {
      const id     = btn.dataset.orderId;
      const select = tbody.querySelector(`.status-select[data-order-id="${id}"]`);
      const status = select.value;
      const resp   = await api(`/api/admin/orders/${id}`, {
        method: 'PUT',
        body: { status }
      });
      if (resp.success) loadAdminOrders();
      else alert(resp.error || 'Erro ao atualizar status');
    };
  });

  // Baixa PDF
  tbody.querySelectorAll('.btn-download').forEach(btn => {
    btn.onclick = async () => {
      const id  = btn.dataset.orderId;
      const ref = btn.dataset.ref;
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
    };
  });
}

// -----------------------
// Gestão de Administradores
// -----------------------
async function loadAdminUsers() {
  const admins = await api('/api/admin/users', { method: 'GET' });
  if (!Array.isArray(admins)) return;
  adminList.innerHTML = '';
  admins.forEach(u => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${u.name} — ${u.email}</span>
      <button class="btn btn-update" data-user-id="${u._id}">❌</button>
    `;
    adminList.appendChild(li);
  });
  // Deletar admin
  adminList.querySelectorAll('button').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.userId;
      if (!confirm('Remover este admin?')) return;
      const resp = await api(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (resp.success) loadAdminUsers();
      else alert(resp.error || 'Erro ao remover admin');
    };
  });
}

// Cria novo admin
createAdminForm.addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(createAdminForm);
  const body = {
    name:     f.get('name'),
    email:    f.get('email'),
    password: f.get('password'),
    secret:   f.get('secret')
  };
  const json = await api('/api/admin/users', { method: 'POST', body });
  if (json.success) {
    createAdminForm.reset();
    loadAdminUsers();
  } else {
    alert(json.error || 'Erro ao criar admin');
  }
});

// -----------------------
// Auditoria
// -----------------------
async function loadAuditLog() {
  const logs = await api('/api/admin/audit', { method: 'GET' });
  if (!Array.isArray(logs)) return;
  auditList.innerHTML = '';
  logs.forEach(a => {
    const time = new Date(a.createdAt).toLocaleString();
    const li = document.createElement('li');
    li.textContent = `${time} — ${a.action} (${a.target || ''}) por ${a.adminEmail||a.admin}`;
    auditList.appendChild(li);
  });
}

// -----------------------
// Filtros & Inicialização
// -----------------------
searchInput.addEventListener('input', loadAdminOrders);
statusFilter.addEventListener('change', loadAdminOrders);
refreshBtn.addEventListener('click', loadAdminOrders);

(async () => {
  await loadAdminOrders();
  await loadAdminUsers();
  await loadAuditLog();
})();
