<?php
/**
 * SELOASA - API Pública de Vacantes para la Bolsa de Trabajo (MySQL / PDO)
 * Devuelve únicamente las vacantes activas publicadas para los candidatos.
 */

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare("SELECT * FROM `vacantes` WHERE `status` = 'published' ORDER BY `sort_order` ASC, `created_at` DESC");
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $items = array_map(function ($v) {
        // En la vista pública de candidatos, nunca exponemos recipient_emails internos
        unset($v['recipient_emails']);
        $v['points'] = !empty($v['points']) ? json_decode($v['points'], true) : [];
        if (!is_array($v['points'])) $v['points'] = [];
        return $v;
    }, $rows);

    echo json_encode([
        'updated_at' => date('c'),
        'items' => $items,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'updated_at' => date('c'),
        'items' => [],
        'error' => 'Error al consultar vacantes en base de datos: ' . $e->getMessage()
    ]);
}
