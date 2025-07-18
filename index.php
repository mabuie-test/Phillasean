<?php
// index.php (na raiz /var/www/html)
// redireciona todas as requisições para o verdadeiro entrypoint em src/public/index.php

// mantemos o mesmo ambiente de execução
require __DIR__ . '/src/bootstrap.php';

// então incluímos o seu index público
require __DIR__ . '/src/public/index.php';
