// admin.js

// ── Guardião de acesso: apenas admins continuam ────────────────────────────
;(function guardAdmin() {
  const token = localStorage.getItem('phil_token');
  if (!token) return window.location.replace('login.html');
  function parseJwt(t) {
    try {
      const p = t.split('.')[1];
      const d = atob(p.replace(/-/g,'+').replace(/_/g,'/'));
      return JSON.parse(decodeURIComponent(
        d.split('').map(c=> '%' + ('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')
      ));
    } catch { return {}; }
  }
  const { role } = parseJwt(token);
  if (role !== 'admin') return window.location.replace('reserva.html');
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

// ── Carrega tudo ao iniciar ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadInvoices();
  loadAuditLogs();
  loadAdmins();
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
        <td style="word-break:break-word; min-width:120px;">${o.services.join(', ')}</td>
        <td>${new Date(inv.date).toLocaleDateString()}</td>
        <td>
          <select data-id="${o._id}" class="statusSelect">
            <option value="pending"    ${o.status==='pending'   ? 'selected':''}>Pendente</option>
            <option value="in_progress"${o.status==='in_progress'? 'selected':''}>Em Progresso</option>
            <option value="completed"  ${o.status==='completed'  ? 'selected':''}>Concluído</option>
          </select>
        </td>
        <td>
          <a 
            href="https://phillasean-1.onrender.com/invoices/${inv.filename}" 
            download 
            style="font-size:1.2rem;"
          >📄</a>
        </td>
        <td>
          <button class="btn-update" data-id="${o._id}">Atualizar</button>
        </td>
      </tr>`;
  }).join('');

  // Hook de mudança de status
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

// ── Listar administradores atuais ────────────────────────────────────────
async function loadAdmins() {
  const res = await fetch(`${API}/admins`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const admins = await res.json();

  const ul = document.getElementById('adminsList');
  ul.innerHTML = admins.map(a =>
    `<li>${a.name} — ${a.email}</li>`
  ).join('');
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
    loadAdmins();
  } else {
    alert('Falha ao criar admin: ' + (json.message || res.status));
  }
};

// ── Carregar logs de auditoria ───────────────────────────────────────────
async function loadAuditLogs() {
  const res = await fetch(`${API}/audit`, { headers });
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
