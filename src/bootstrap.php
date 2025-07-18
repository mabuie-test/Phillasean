<?php
session_start();
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/config.php';

// Função para pegar coleção Mongo
function getCollection(string $name) {
    $client = new MongoDB\Client(MONGO_URI);
    return $client->selectDatabase(MONGO_DB)->selectCollection($name);
}
