<?php
/**
 * SELOASA - API Pública de Vacantes para la Bolsa de Trabajo (Almacenamiento JSON Seguro)
 * Devuelve únicamente las vacantes activas publicadas para los candidatos.
 */

require_once __DIR__ . '/admin_helper.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Access-Control-Allow-Origin: *');

try {
    $rows = admin_get_public_vacancies();

    $items = array_map(function ($v) {
        // En la vista pública de candidatos, nunca exponemos recipient_emails internos
        unset($v['recipient_emails']);
        $v['points'] = !empty($v['points']) && is_array($v['points']) ? $v['points'] : [];
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
        'error' => 'Error al consultar vacantes: ' . $e->getMessage()
    ]);
}
