// admin.js

console.log('⚙️ admin.js carregado');
const auditList = document.getElementById('auditList');
const API_BASE       = 'https://phillaseanbackend.onrender.com';
const authTokenKey   = 'phil_token';

// Helper para chamadas à API com tratamento de 401
async function api(path, opts = {}) {
  console.log(`→ api: ${opts.method||'GET'} ${path}`, opts.body||'');
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
    console.warn('← api: 401 Não autorizado');
    window.location.href = 'login.html';
    return;
  }
  const data = await res.json();
  console.log('← api resposta:', data);
  return data;
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  console.log('Logout clicado');
  localStorage.removeItem(authTokenKey);
  window.location.href = 'login.html';
});

// Elementos da interface de pedidos
const tbody        = document.querySelector('#adminTable tbody');
const searchInput  = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn   = document.getElementById('refreshBtn');

// Elementos da interface de gestão de admins
const createAdminForm = document.getElementById('createAdminForm');
const adminList       = document.getElementById('adminList');

// --------------------------
// Funções de pedidos
// --------------------------
async function loadAdminOrders() {
  console.log('Carregando pedidos de admin...');
  const orders = await api('/api/admin/orders', { method: 'GET' });
  if (!Array.isArray(orders)) {
    console.error('loadAdminOrders: orders não é array', orders);
    return;
  }

  // Filtrar por status
  let filtered = statusFilter.value
    ? orders.filter(o => o.status === statusFilter.value)
    : orders.slice();

  // Buscar por texto
  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(o =>
      (o.client.name || '').toLowerCase().includes(q) ||
      (o.client.email || '').toLowerCase().includes(q) ||
      (o.details?.service || '').toLowerCase().includes(q) ||
      (o.reference || '').toLowerCase().includes(q)
    );
  }

  console.log('Pedidos após filtro:', filtered);

  // Montar linhas da tabela
  tbody.innerHTML = '';
  filtered.forEach(o => {
    const histHtml = (o.history || []).map(h =>
      `<li>${new Date(h.changedAt).toLocaleDateString()} — ${h.status} (${h.by})</li>`
    ).join('');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o._id}</td>
      <td>${o.client.name}<br><small>${o.client.email}</small></td>
      <td>${o.details?.service || '–'}</td>
      <td>${o.details?.quantity || '–'}</td>
      <td class="status-cell ${o.status}">${o.status.replace('_', ' ')}</td>
      <td><ul class="history-list">${histHtml}</ul></td>
      <td>
        <button class="btn btn-download" data-order-id="${o._id}" data-ref="${o.reference}">
          PDF
        </button>
      </td>
      <td>
        <select class="status-select" data-order-id="${o._id}">
          <option value="pending" ${o.status==='pending'?'selected':''}>Pendente</option>
          <option value="in_progress" ${o.status==='in_progress'?'selected':''}>Em Progresso</option>
          <option value="completed" ${o.status==='completed'?'selected':''}>Concluído</option>
        </select>
        <button class="btn btn-update" data-order-id="${o._id}">OK</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachOrderListeners();
}

function attachOrderListeners() {
  console.log('Anexando listeners de pedidos...');
  // Atualizar status
  tbody.querySelectorAll('.btn-update').forEach(btn => {
    btn.onclick = async () => {
      const orderId = btn.dataset.orderId;
      const select  = tbody.querySelector(`.status-select[data-order-id="${orderId}"]`);
      const status  = select.value;
      console.log(`Atualizando status do pedido ${orderId} para ${status}`);
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

  // Download de PDF
  tbody.querySelectorAll('.btn-download').forEach(btn => {
    btn.onclick = async () => {
      const orderId = btn.dataset.orderId;
      const ref     = btn.dataset.ref;
      console.log(`Baixando factura ${ref} (order ${orderId})`);
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/invoice`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem(authTokenKey) }
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('Erro no fetch da factura:', err);
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

// --------------------------
// Funções de gestão de Admins
// --------------------------
async function loadAdmins() {
  console.log('Carregando lista de administradores...');
  const admins = await api('/api/admin/users', { method: 'GET' });
  if (!Array.isArray(admins)) {
    console.error('loadAdmins: resposta inválida', admins);
    return;
  }
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

// Carrega e exibe o log de auditoria
async function loadAuditLog() {
  console.log('Carregando log de auditoria...');
  const logs = await api('/api/admin/audit', { method: 'GET' });
  if (!Array.isArray(logs)) {
    console.error('loadAuditLog: resposta inválida', logs);
    return;
  }
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




function attachAdminListeners() {
  console.log('Anexando listeners de admins...');
  adminList.querySelectorAll('.btn-delete-admin').forEach(btn => {
    btn.onclick = async () => {
      const adminId = btn.dataset.adminId;
      if (!confirm('Remover este administrador?')) return;
      console.log(`Removendo admin ${adminId}`);
      const resp = await api(`/api/admin/users/${adminId}`, { method: 'DELETE' });
      if (resp?.success) {
        alert('Administrador removido');
        loadAdmins();
      } else {
        alert(resp?.error || 'Erro ao remover administrador');
      }
    };
  });
}

createAdminForm.addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(createAdminForm);
  const body = {
    name:     f.get('name'),
    email:    f.get('email'),
    password: f.get('password'),
    secret:   f.get('secret')
  };
  console.log('Criando novo admin:', body);
  const resp = await api('/api/admin/users', { method: 'POST', body });
  if (resp?.success) {
    alert('Administrador criado');
    createAdminForm.reset();
    loadAdmins();
  } else {
    alert(resp?.error || 'Erro ao criar administrador');
  }
});

// Eventos de filtro e busca para pedidos
searchInput.addEventListener('input', loadAdminOrders);
statusFilter.addEventListener('change', loadAdminOrders);
refreshBtn.addEventListener('click', loadAdminOrders);

// Inicialização
(async () => {
  await loadAdminOrders();
  await loadAdmins();
  await loadAuditLog();
})();
