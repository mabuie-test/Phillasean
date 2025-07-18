<?php
require __DIR__ . '/../bootstrap.php';
use App\Controllers\OrderController;

$input = json_decode(file_get_contents('php://input'), true);
$ctrl  = new OrderController();
echo json_encode($ctrl->create($input));
