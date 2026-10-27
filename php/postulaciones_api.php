<?php
/**
 * SELOASA - API REST de Postulaciones y Candidaturas Recibidas (Almacenamiento JSON Seguro)
 * Gestiona el registro de candidatos que enviaron su CV desde la bolsa de trabajo en php/storage/postulaciones.json
 */

require_once __DIR__ . '/admin_helper.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && str_contains($origin, $host)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Admin-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Proteger privacidad: solo administradores autenticados pueden ver o gestionar postulaciones
if (!admin_is_authenticated()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'No autorizado: Se requiere sesión de administrador para consultar postulaciones de candidatos.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$store = admin_get_postulaciones_store();
$items = $store['items'];

/* ==========================================================================
   GET: OBTENER POSTULACIONES
   ========================================================================== */
if ($method === 'GET') {
    $vacanteId = isset($_GET['vacante_id']) ? trim($_GET['vacante_id']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';

    if ($vacanteId !== '' && $vacanteId !== 'all') {
        $items = array_values(array_filter($items, function ($p) use ($vacanteId) {
            return ($p['vacante_id'] ?? '') === $vacanteId;
        }));
    }

    if ($status !== '' && $status !== 'all') {
        $items = array_values(array_filter($items, function ($p) use ($status) {
            return ($p['status'] ?? '') === $status;
        }));
    }

    // Ordenar por created_at descendente
    usort($items, function ($a, $b) {
        $timeA = strtotime($a['created_at'] ?? 'now');
        $timeB = strtotime($b['created_at'] ?? 'now');
        return $timeB <=> $timeA;
    });

    echo json_encode([
        'success' => true,
        'count' => count($items),
        'items' => $items,
        'updated_at' => $store['updated_at'] ?? date('c')
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ==========================================================================
   POST: ACTUALIZAR ESTADO DE POSTULACIÓN
   ========================================================================== */
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    if (!is_array($payload) || !isset($payload['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Se requiere el id de la postulación'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = (int) $payload['id'];
    $newStatus = trim($payload['status'] ?? 'revisado');
    $updated = false;

    foreach ($items as $idx => $cand) {
        if ((int) ($cand['id'] ?? 0) === $id) {
            $items[$idx]['status'] = $newStatus;
            $items[$idx]['updated_at'] = date('c');
            $updated = true;
            break;
        }
    }

    if ($updated) {
        admin_save_postulaciones_store($items);
        echo json_encode(['success' => true, 'message' => 'Estado de postulación actualizado correctamente']);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Postulación no encontrada']);
    }
    exit;
}

/* ==========================================================================
   DELETE: ELIMINAR POSTULACIÓN
   ========================================================================== */
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    if ($id <= 0) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $id = (int) ($data['id'] ?? 0);
    }

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID inválido de postulación'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $filtered = array_values(array_filter($items, function ($p) use ($id) {
        return (int) ($p['id'] ?? 0) !== $id;
    }));

    if (count($filtered) === count($items)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Postulación no encontrada para eliminar']);
        exit;
    }

    admin_save_postulaciones_store($filtered);
    echo json_encode(['success' => true, 'message' => 'Postulación eliminada']);
    exit;
}
