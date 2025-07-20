// admin.js

console.log('⚙️ admin.js carregado');

const API_BASE     = 'https://phillaseanbackend.onrender.com';
const authTokenKey = 'phil_token';

// Helper para chamadas à API com tratamento de 401
async function api(path, opts = {}) {
  console.log(`→ API ${opts.method||'GET'} ${path}`, opts.body||'');
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
    console.warn('← API 401 Não autorizado');
    window.location.href = 'login.html';
    return;
  }
  const data = await res.json();
  console.log('← API resposta:', data);
  return data;
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  console.log('Logout clicado');
  localStorage.removeItem(authTokenKey);
  window.location.href = 'login.html';
});

// Elementos
const tbody         = document.querySelector('#adminTable tbody');
const searchInput   = document.getElementById('searchInput');
const statusFilter  = document.getElementById('statusFilter');
const refreshBtn    = document.getElementById('refreshBtn');

const createAdminForm = document.getElementById('createAdminForm');
const adminList        = document.getElementById('adminList');
const auditList        = document.getElementById('auditList');

// Carrega pedidos do admin
async function loadAdminOrders() {
  console.log('Carregando pedidos de admin...');
  const orders = await api('/api/admin/orders', { method: 'GET' });
  if (!Array.isArray(orders)) {
    console.error('loadAdminOrders: orders não é array', orders);
    return;
  }

  // filtros
  let filtered = statusFilter.value
    ? orders.filter(o => o.status === statusFilter.value)
    : orders.slice();

  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(o =>
      (o.client.name||'').toLowerCase().includes(q) ||
      (o.client.email||'').toLowerCase().includes(q) ||
      (o.details.services || []).some(s => s.toLowerCase().includes(q)) ||
      (o.reference||'').toLowerCase().includes(q)
    );
  }

  console.log('Pedidos após filtro:', filtered);

  // montar tabela
  tbody.innerHTML = '';
  filtered.forEach(o => {
    // serviços como lista
    const servicesHtml = Array.isArray(o.details.services) && o.details.services.length
      ? `<ul>${o.details.services.map(s => `<li>${s}</li>`).join('')}</ul>`
      : '—';

    // histórico
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

  attachActionListeners();
}

// Anexa listeners após renderizar
function attachActionListeners() {
  // atualizar status
  tbody.querySelectorAll('.btn-update').forEach(btn => {
    btn.onclick = async () => {
      const id     = btn.dataset.orderId;
      const select = tbody.querySelector(`.status-select[data-order-id="${id}"]`);
      const status = select.value;
      console.log(`Atualizando pedido ${id} → ${status}`);
      const resp = await api(`/api/admin/orders/${id}`, {
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

  // download PDF
  tbody.querySelectorAll('.btn-download').forEach(btn => {
    btn.onclick = async () => {
      const id  = btn.dataset.orderId;
      const ref = btn.dataset.ref;
      console.log(`Baixando factura ${ref}`);
      try {
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
}

// gestão de admins
async function loadAdminUsers() {
  const admins = await api('/api/admin/users', { method: 'GET' });
  if (!Array.isArray(admins)) return;
  adminList.innerHTML = '';
  admins.forEach(u => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${u.name} &mdash; ${u.email}</span>
      <button class="btn btn-update" data-user-id="${u._id}">❌</button>
    `;
    adminList.appendChild(li);
  });
  // delete admin
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

// criar novo admin
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

// carregar logs de auditoria
async function loadAuditLog() {
  const logs = await api('/api/admin/audit', { method: 'GET' });
  if (!Array.isArray(logs)) return;
  auditList.innerHTML = '';
  logs.forEach(a => {
    const li = document.createElement('li');
    const time = new Date(a.createdAt).toLocaleString();
    li.textContent = `${time} — ${a.action} (por ${a.adminEmail || a.admin})`;
    auditList.appendChild(li);
  });
}

// filtros e busca
searchInput.addEventListener('input', loadAdminOrders);
statusFilter.addEventListener('change', loadAdminOrders);
refreshBtn.addEventListener('click', loadAdminOrders);

// init
(async () => {
  await loadAdminOrders();
  await loadAdminUsers();
  await loadAuditLog();
})();
