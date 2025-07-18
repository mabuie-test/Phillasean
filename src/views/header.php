<?php
// header.php
// Inicie a sessão caso ainda não esteja ativa
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}
$user = $_SESSION['user'] ?? null;
?>
<!–– NAVBAR ––>
<header>
  <div class="container header-container">
    <div class="logo">
      <img src="/assets/images/phil.jpeg" alt="Logo">
      <div class="logo-text">
        <h1>PHIL ASEAN</h1>
        <p>Provider &amp; Logistics</p>
      </div>
    </div>
    <button id="mobile-menu-btn" class="mobile-menu-btn">
      <i class="fas fa-bars"></i>
    </button>
    <nav>
      <ul id="main-menu">
        <li><a href="/public/index.php"><i class="fas fa-home"></i> Início</a></li>
        <?php if ($user): ?>
          <li class="auth-dropdown">
            <a href="#"><i class="fas fa-user-circle"></i>
              Olá, <?= htmlspecialchars($user['name']) ?></a>
            <div class="auth-dropdown-content">
              <a href="/public/client-portal.php">
                <i class="fas fa-tachometer-alt"></i> Portal do Cliente
              </a>
              <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
            </div>
          </li>
        <?php else: ?>
          <li><a href="#" id="login-btn-nav"><i class="fas fa-sign-in-alt"></i> Login</a></li>
          <li><a href="#" id="register-btn-nav"><i class="fas fa-user-plus"></i> Registrar</a></li>
        <?php endif; ?>
      </ul>
    </nav>
  </div>
</header>

<!–– MODAL DE AUTENTICAÇÃO ––>
<div id="auth-modal" class="auth-modal">
  <div class="auth-modal-content">
    <div class="auth-tabs">
      <div id="login-tab" class="auth-tab active">Login</div>
      <div id="register-tab" class="auth-tab">Registrar</div>
    </div>
    <div class="auth-form" id="login-form">
      <div class="auth-form-group">
        <label for="login-email">Email</label>
        <input type="email" id="login-email" class="auth-form-control" required>
      </div>
      <div class="auth-form-group">
        <label for="login-password">Senha</label>
        <input type="password" id="login-password" class="auth-form-control" required>
      </div>
      <button id="login-submit-btn" class="btn">Entrar</button>
      <p class="auth-form-footer">
        Ainda não tem conta? <a href="#" id="switch-to-register">Registre‑se</a>
      </p>
    </div>
    <div class="auth-form" id="register-form" style="display:none;">
      <div class="auth-form-group">
        <label for="reg-name">Nome Completo</label>
        <input type="text" id="reg-name" class="auth-form-control" required>
      </div>
      <div class="auth-form-group">
        <label for="reg-email">Email</label>
        <input type="email" id="reg-email" class="auth-form-control" required>
      </div>
      <div class="auth-form-group">
        <label for="reg-password">Senha</label>
        <input type="password" id="reg-password" class="auth-form-control" required>
      </div>
      <button id="register-submit-btn" class="btn">Registrar</button>
      <p class="auth-form-footer">
        Já tem conta? <a href="#" id="switch-to-login">Entre</a>
      </p>
    </div>
    <button class="close-modal" id="close-auth-modal">&times;</button>
  </div>
</div>

<!–– INCLUI OS SCRIPTS ––>
<!-- FontAwesome -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js"></script>
<!-- Seu JavaScript de handlers -->
<script src="/public/assets/script.js"></script>
