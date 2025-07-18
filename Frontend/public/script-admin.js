async function loadOrders() {
  const { orders } = await apiFetch('/orders', { method:'GET' });
  const tb = document.querySelector('#orders-table tbody');
  tb.innerHTML = '';
  orders.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o._id}</td>
      <td>${o.name}</td>
      <td>${o.email}</td>
      <td>${o.service}</td>
      <td>${o.status}</td>
      <td><a href="${o.invoice}" target="_blank">PDF</a></td>
      <td>
        ${o.status==='pending'
          ? `<button data-id="${o._id}" class="btn-process">Processar</button>`
          : ''
        }
      </td>`;
    tb.appendChild(tr);
  });
  document.querySelectorAll('.btn-process').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await apiFetch(`/orders/${id}/status`, {
        method:'PATCH', body: JSON.stringify({ status:'processed' })
      });
      loadOrders();
    };
  });
}

loadOrders();
