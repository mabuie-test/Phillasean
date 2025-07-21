// admin.js

// ── Guardião de acesso: apenas admins continuam ────────────────────────────
;(function guardAdmin() {
  const token = localStorage.getItem('phil_token');
  if (!token) {
    // não autenticado
    return window.location.replace('login.html');
  }
  // helper para decodificar payload JWT
  function parseJwt(t) {
    try {
      const payload = t.split('.')[1];
      const decoded = atob(payload.replace(/-/g,'+').replace(/_/g,'/'));
      return JSON.parse(decodeURIComponent(
        decoded.split('')
               .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
               .join('')
      ));
    } catch {
      return {};
    }
  }
  const { role } = parseJwt(token);
  if (role !== 'admin') {
    // usuário não‑admin não pode ficar no painel
    return window.location.replace('reserva.html');
  }
})();

// ── Configurações comuns ─────────────────────────────────────────────────
const API   = 'https://phillasean-1.onrender.com/api/admin';
const token = localStorage.getItem('phil_token');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + token
};

// ── Logout ────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem('phil_token');
  window.location.href = 'login.html';
};

// ── Carrega dados ao iniciar ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadInvoices();
  loadAuditLogs();
});

// ── Filtrar faturas ──────────────────────────────────────────────────────
document.getElementById('btnFilter').onclick = () => {
  loadInvoices({
    status:   document.getElementById('filterStatus').value,
    dateFrom: document.getElementById('filterDateFrom').value,
    dateTo:   document.getElementById('filterDateTo').value
  });
};

// ── Listar e renderizar faturas ──────────────────────────────────────────
async function loadInvoices(filters = {}) {
  const qs  = new URLSearchParams(filters).toString();
  const res = await fetch(`${API}/invoices?${qs}`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const invoices = await res.json();

  const tbody = document.querySelector('#ordersTable tbody');
  tbody.innerHTML = invoices.map(inv => {
    const o = inv.order;
    return `
      <tr>
        <td>${inv._id}</td>
        <td>${o.client.name} (${o.client.email})</td>
        <td>${o.services.join(', ')}</td>
        <td>${new Date(inv.date).toLocaleDateString()}</td>
        <td>
          <select data-id="${o._id}" class="statusSelect">
            <option value="pending"    ${o.status==='pending'   ? 'selected':''}>Pendente</option>
            <option value="in_progress"${o.status==='in_progress'? 'selected':''}>Em Progresso</option>
            <option value="completed"  ${o.status==='completed'  ? 'selected':''}>Concluído</option>
          </select>
        </td>
        <td><a href="https://phillasean-1.onrender.com/invoices/${inv.filename}" download>📄</a></td>
        <td><button class="btn-update" data-id="${o._id}">Atualizar</button></td>
      </tr>`;
  }).join('');

  // Atualiza status da ordem via PUT /api/admin/invoices/:orderId
  document.querySelectorAll('.statusSelect').forEach(sel => {
    sel.onchange = async () => {
      const orderId = sel.dataset.id;
      const status  = sel.value;
      await fetch(`${API}/invoices/${orderId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      loadAuditLogs();
    };
  });
}

// ── Criar novo admin ─────────────────────────────────────────────────────
document.getElementById('createAdminForm').onsubmit = async e => {
  e.preventDefault();
  const name  = document.getElementById('newAdminName').value;
  const email = document.getElementById('newAdminEmail').value;
  const pass  = document.getElementById('newAdminPass').value;

  const res  = await fetch(`${API}/admins`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, email, password: pass })
  });
  const json = await res.json();

  if (res.ok) {
    alert('Admin criado com sucesso: ' + json.email);
    e.target.reset();
    loadAuditLogs();
  } else {
    alert('Falha ao criar admin: ' + (json.message || res.status));
  }
};

// ── Carregar logs de auditoria ───────────────────────────────────────────
async function loadAuditLogs() {
  const res  = await fetch(`${API}/audit`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const logs = await res.json();

  const tbody = document.querySelector('#auditTable tbody');
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${l.user.name || l.user}</td>
      <td>${l.action}</td>
      <td>${new Date(l.timestamp).toLocaleString()}</td>
    </tr>
  `).join('');
}
