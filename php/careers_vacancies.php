<?php

require_once __DIR__ . '/admin_helper.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$store = admin_get_vacancy_store();

echo json_encode([
    'updated_at' => (string) ($store['updated_at'] ?? date('c')),
    'items' => admin_get_public_vacancies(),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
