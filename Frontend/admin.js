// admin.js
console.log('⚙️ admin.js carregado');

const API_BASE     = 'https://phillaseanbackend.onrender.com';
const authTokenKey = 'phil_token';

// elementos pedidos
const tbody        = document.querySelector('#adminTable tbody');
const searchInput  = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn   = document.getElementById('refreshBtn');
// elementos gestão de admins
const createAdminForm = document.getElementById('createAdminForm');
const adminList       = document.getElementById('adminList');
// elementos auditoria
const auditList       = document.getElementById('auditList');

// helper genérico para chamar a API
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers||{}) };
  const token = localStorage.getItem(authTokenKey);
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { ...opts, headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (res.status === 401) {
    window.location.href = 'login.html';
    return;
  }
  return res.json();
}

// ─── 1) LOAD E RENDER DE PEDIDOS ──────────────────────────────────────
async function loadAdminOrders() {
  const orders = await api('/api/admin/orders', { method: 'GET' });
  if (!Array.isArray(orders)) return;

  // filtro de status + busca full‑text
  const q = searchInput.value.trim().toLowerCase();
  let filtered = orders.filter(o => {
    const byStatus = !statusFilter.value || o.status === statusFilter.value;
    const byText   = !q || [
      o.client.name,
      o.client.email,
      o.reference,
      ...(o.details.services||[])
    ].some(str => str?.toLowerCase().includes(q));
    return byStatus && byText;
  });

  // renderiza
  tbody.innerHTML = '';
  filtered.forEach(o => {
    const servicesHtml = (o.details.services||[]).length
      ? `<ul>${o.details.services.map(s=>`<li>${s}</li>`).join('')}</ul>`
      : '—';
    const histHtml = (o.history||[])
      .map(h=>`<li>${new Date(h.changedAt).toLocaleDateString()} — ${h.status} (${h.by})</li>`)
      .join('');

    tbody.insertAdjacentHTML('beforeend', `
      <tr>
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
            <option value="pending"    ${o.status==='pending'    ?'selected':''}>Pendente</option>
            <option value="in_progress"${o.status==='in_progress'? 'selected':''}>Em Progresso</option>
            <option value="completed"  ${o.status==='completed'  ?'selected':''}>Concluído</option>
          </select>
          <button class="btn btn-update" data-id="${o._id}">OK</button>
        </td>
      </tr>
    `);
  });

  attachOrderListeners();
}

function attachOrderListeners() {
  // atualizar status
  tbody.querySelectorAll('.btn-update').forEach(btn => {
    btn.onclick = async () => {
      const id     = btn.dataset.id;
      const status = tbody.querySelector(`.status-select[data-id="${id}"]`).value;
      const resp   = await api(`/api/admin/orders/${id}`, { method:'PUT', body:{status} });
      if (resp.success) loadAdminOrders();
      else alert(resp.error||'Erro ao atualizar status');
    };
  });

  // baixar PDF
  tbody.querySelectorAll('.btn-download').forEach(btn => {
    btn.onclick = async () => {
      const id  = btn.dataset.id;
      const ref = btn.dataset.ref;
      const res = await fetch(`${API_BASE}/api/orders/${id}/invoice`, {
        headers: { 'Authorization': 'Bearer '+localStorage.getItem(authTokenKey) }
      });
      if (!res.ok) {
        const e = await res.json();
        return alert(e.error||'Erro ao baixar factura');
      }
      const blob = await res.blob();
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = `factura-${ref}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    };
  });
}

// ─── 2) GESTÃO DE ADMINISTRADORES ──────────────────────────────────
async function loadAdmins() {
  const admins = await api('/api/admin/users', { method:'GET' });
  if (!Array.isArray(admins)) return;
  adminList.innerHTML = '';
  admins.forEach(a => {
    adminList.insertAdjacentHTML('beforeend', `
      <li>
        ${a.name} (${a.email})
        <button class="btn btn-delete-admin" data-admin-id="${a._id}">Excluir</button>
      </li>
    `);
  });
  adminList.querySelectorAll('.btn-delete-admin').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Remover este administrador?')) return;
      await api(`/api/admin/users/${btn.dataset.adminId}`, { method:'DELETE' });
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
  const resp = await api('/api/admin/users', { method:'POST', body });
  if (resp.success) {
    createAdminForm.reset();
    loadAdmins();
  } else alert(resp.error||'Erro ao criar admin');
});

// ─── 3) REGISTOS DE AUDITORIA ──────────────────────────────────────
async function loadAuditLog() {
  const logs = await api('/api/admin/audit', { method:'GET' });
  if (!Array.isArray(logs)) return;
  auditList.innerHTML = '';
  logs.forEach(l => {
    auditList.insertAdjacentHTML('beforeend', `
      <li>
        ${new Date(l.timestamp).toLocaleString()} — ${l.action}  
        por ${l.admin?.name||'–'}
      </li>
    `);
  });
}

// ─── 4) LOGOUT E EVENTOS ──────────────────────────────────────────
document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem(authTokenKey);
  window.location.href = 'login.html';
};
searchInput.oninput    = loadAdminOrders;
statusFilter.onchange   = loadAdminOrders;
refreshBtn.onclick      = loadAdminOrders;

// inicializa tudo
(async function(){
  await loadAdminOrders();
  await loadAdmins();
  await loadAuditLog();
})();
