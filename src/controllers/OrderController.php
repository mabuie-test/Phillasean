<?php
namespace App\Controllers;
use MongoDB\BSON\UTCDateTime, MongoDB\BSON\ObjectId;

class OrderController {
    public function create($data) {
        $orders = getCollection('orders');
        // validações...
        $order = [ /* monta o doc */ ];
        $res   = $orders->insertOne($order);
        // gerar fatura e enviar email...
        return ['success'=>true,'orderId'=>(string)$res->getInsertedId()];
    }
    public function list($user) {
        $orders = getCollection('orders');
        $filter = $user['role']==='admin'
                  ? []
                  : ['userId'=>new ObjectId($user['id'])];
        return iterator_to_array($orders->find($filter));
    }
}
