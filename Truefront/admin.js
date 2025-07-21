// admin.js
const API = 'https://phillasean-1.onrender.com/api';
const token = localStorage.getItem('phil_token');

// cabeçalho comum
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + token
};

// Logout
document.getElementById('logoutBtn').onclick = () => {
  localStorage.removeItem('phil_token');
  window.location.href = 'login.html';
};

// Carrega pedidos e logs ao entrar
window.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  loadAuditLogs();
});

// Filtrar pedidos
document.getElementById('btnFilter').onclick = () => loadOrders({
  status: document.getElementById('filterStatus').value,
  from: document.getElementById('filterDateFrom').value,
  to: document.getElementById('filterDateTo').value
});

// Função para obter e renderizar pedidos
async function loadOrders(filters = {}) {
  const qs = new URLSearchParams(filters).toString();
  const res = await fetch(`${API}/admin/orders?${qs}`, { headers });
  const orders = await res.json();
  const tbody = document.querySelector('#ordersTable tbody');
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td>${o._id}</td>
      <td>${o.name} (${o.email})</td>
      <td>${o.services.join(', ')}</td>
      <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      <td>
        <select data-id="${o._id}" class="statusSelect">
          <option ${o.status==='pending'? 'selected':''} value="pending">Pendente</option>
          <option ${o.status==='in_progress'? 'selected':''} value="in_progress">Em Progresso</option>
          <option ${o.status==='completed'? 'selected':''} value="completed">Concluído</option>
        </select>
      </td>
      <td><a href="https://phillasean-1.onrender.com/invoices/${o.invoice.filename}" download>📄</a></td>
      <td><button class="btn-download" data-id="${o._id}">Atualizar</button></td>
    </tr>
  `).join('');

  // Ações de atualização de status
  document.querySelectorAll('.statusSelect').forEach(sel => {
    sel.onchange = async () => {
      const id = sel.dataset.id;
      const status = sel.value;
      await fetch(`${API}/admin/orders/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      loadAuditLogs(); // atualiza logs
    };
  });
}

// Criar novo admin
document.getElementById('createAdminForm').onsubmit = async e => {
  e.preventDefault();
  const name = document.getElementById('newAdminName').value;
  const email= document.getElementById('newAdminEmail').value;
  const pass = document.getElementById('newAdminPass').value;
  const res  = await fetch(`${API}/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, email, password: pass, role: 'admin' })
  });
  if (res.ok) {
    alert('Admin criado com sucesso!');
    e.target.reset();
    loadAuditLogs();
  } else {
    alert('Falha ao criar admin');
  }
};

// Carrega logs de auditoria
async function loadAuditLogs() {
  const res = await fetch(`${API}/admin/audit`, { headers });
  const logs = await res.json();
  const tbody = document.querySelector('#auditTable tbody');
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${l.user}</td>
      <td>${l.action}</td>
      <td>${new Date(l.timestamp).toLocaleString()}</td>
    </tr>
  `).join('');
}
