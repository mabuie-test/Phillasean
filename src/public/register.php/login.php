<?php
require __DIR__ . '/../bootstrap.php';
use App\Controllers\AuthController;

$input = json_decode(file_get_contents('php://input'), true);
$ctrl  = new AuthController();
echo json_encode($ctrl->register($input));

