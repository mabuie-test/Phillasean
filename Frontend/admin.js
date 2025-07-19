// admin.js

const API_BASE     = 'https://phillaseanbackend.onrender.com';
const authTokenKey = 'phil_token';

// Helper para chamadas à API com tratamento de 401
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

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem(authTokenKey);
  window.location.href = 'login.html';
});

// Elementos da interface
const tbody        = document.querySelector('#adminTable tbody');
const searchInput  = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn   = document.getElementById('refreshBtn');

// Carrega e renderiza pedidos
async function loadAdminOrders() {
  const orders = await api('/api/admin/orders', { method: 'GET' });
  if (!orders) return;

  // Filtrar por status
  let filtered = orders;
  if (statusFilter.value) {
    filtered = filtered.filter(o => o.status === statusFilter.value);
  }

  // Buscar por texto
  const q = searchInput.value.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(o =>
      o.client.name.toLowerCase().includes(q) ||
      o.client.email.toLowerCase().includes(q) ||
      o.details.service.toLowerCase().includes(q) ||
      (o.reference || '').toLowerCase().includes(q)
    );
  }

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
      <td>${o.details.service}</td>
      <td>${o.details.quantity}</td>
      <td class="status-cell ${o.status}">${o.status.replace('_', ' ')}</td>
      <td><ul class="history-list">${histHtml}</ul></td>
      <td>
        <button class="btn btn-download" data-id="${o._id}" data-ref="${o.reference}">
          PDF
        </button>
      </td>
      <td>
        <select class="status-select" data-id="${o._id}">
          <option value="pending" ${o.status==='pending'?'selected':''}>Pendente</option>
          <option value="in_progress" ${o.status==='in_progress'?'selected':''}>Em Progresso</option>
          <option value="completed" ${o.status==='completed'?'selected':''}>Concluído</option>
        </select>
        <button class="btn btn-update" data-id="${o._id}">OK</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachActionListeners();
}

// Anexa listeners aos botões criados dinamicamente
function attachActionListeners() {
  // Atualizar status
  tbody.querySelectorAll('.btn-update').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const select = tbody.querySelector(`.status-select[data-id="${id}"]`);
      const status = select.value;
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

  // Download de PDF
  tbody.querySelectorAll('.btn-download').forEach(btn => {
    btn.onclick = async () => {
      const id  = btn.dataset.id;
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

// Eventos de filtro e busca
searchInput.addEventListener('input', loadAdminOrders);
statusFilter.addEventListener('change', loadAdminOrders);
refreshBtn.addEventListener('click', loadAdminOrders);

// Inicialização
loadAdminOrders();
