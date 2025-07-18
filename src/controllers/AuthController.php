<?php
namespace App\Controllers;

use MongoDB\BSON\ObjectId;

class AuthController {
    public function register($data) {
        $users = getCollection('users');
        // validações, hash, insert...
    }
    public function login($data) {
        $users = getCollection('users');
        // busca, password_verify, session...
    }
    public function logout() {
        session_destroy();
    }
}
