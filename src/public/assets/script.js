document.addEventListener('DOMContentLoaded', () => {
  // ------ Mobile Menu Toggle ------
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mainMenu      = document.getElementById('main-menu');
  mobileMenuBtn?.addEventListener('click', () => {
    mainMenu.classList.toggle('show');
  });

  // ------ Smooth Scrolling ------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const tgt = document.querySelector(anchor.getAttribute('href'));
      if (tgt) {
        mainMenu.classList.remove('show');
        window.scrollTo({ top: tgt.offsetTop - 80, behavior: 'smooth' });
      }
    });
  });

  // ------ Auth Modal Handlers ------
  const authModal      = document.getElementById('auth-modal');
  const loginForm      = document.getElementById('login-form');
  const registerForm   = document.getElementById('register-form');
  const loginTab       = document.getElementById('login-tab');
  const registerTab    = document.getElementById('register-tab');
  const btnNavLogin    = document.getElementById('login-btn-nav');
  const btnNavRegister = document.getElementById('register-btn-nav');
  const closeAuthBtn   = document.getElementById('close-auth-modal');

  function showLogin() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display    = 'block';
    registerForm.style.display = 'none';
  }
  function showRegister() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display    = 'none';
  }

  btnNavLogin?.addEventListener('click', e => {
    e.preventDefault();
    authModal.style.display = 'flex';
    showLogin();
  });
  btnNavRegister?.addEventListener('click', e => {
    e.preventDefault();
    authModal.style.display = 'flex';
    showRegister();
  });
  closeAuthBtn?.addEventListener('click', () => authModal.style.display = 'none');
  authModal?.addEventListener('click', e => {
    if (e.target === authModal) authModal.style.display = 'none';
  });
  loginTab?.addEventListener('click', showLogin);
  registerTab?.addEventListener('click', showRegister);

  // ------ AJAX Generic ------
  function handleFetch(url, payload, onSuccess) {
    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(js => {
      alert(js.message);
      if (js.success && onSuccess) onSuccess(js);
    })
    .catch(() => alert(`Falha ao conectar com ${url}`));
  }

  // ------ Register ------
  document.getElementById('register-submit-btn')?.addEventListener('click', e => {
    e.preventDefault();
    handleFetch('/public/register.php', {
      name:     document.getElementById('reg-name').value.trim(),
      email:    document.getElementById('reg-email').value.trim(),
      password: document.getElementById('reg-password').value
    }, () => showLogin());
  });

  // ------ Login ------
  document.getElementById('login-submit-btn')?.addEventListener('click', e => {
    e.preventDefault();
    handleFetch('/public/login.php', {
      email:    document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value
    }, () => window.location.reload());
  });

  // ------ Logout ------
  document.getElementById('logout-btn')?.addEventListener('click', e => {
    e.preventDefault();
    handleFetch('/public/logout.php', {}, () => window.location = '/public/index.php');
  });

  // ------ Create Order ------
  document.getElementById('service-order-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      name:     document.getElementById('name').value,
      company:  document.getElementById('company').value,
      email:    document.getElementById('email').value,
      phone:    document.getElementById('phone').value,
      vessel:   document.getElementById('vessel').value,
      port:     document.getElementById('port').value,
      date:     document.getElementById('date').value,
      service:  document.getElementById('service').value,
      quantity: document.getElementById('quantity').value,
      notes:    document.getElementById('notes').value
    };
    handleFetch('/public/create_order.php', data, () => {
      document.getElementById('form-messages').innerHTML =
        '<span class="success">Pedido enviado com sucesso!</span>';
      e.target.reset();
    });
  });
});
