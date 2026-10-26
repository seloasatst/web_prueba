<?php
/**
 * SELOASA - API REST de Postulaciones y Candidaturas Recibidas (MySQL / PDO)
 * Gestiona el registro de candidatos que enviaron su CV desde la bolsa de trabajo.
 */

require_once __DIR__ . '/db.php';
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

try {
    $pdo = get_db_connection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error de conexión a BD: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* ==========================================================================
   GET: OBTENER POSTULACIONES
   ========================================================================== */
if ($method === 'GET') {
    $vacanteId = isset($_GET['vacante_id']) ? trim($_GET['vacante_id']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';

    $sql = "SELECT * FROM `postulaciones` WHERE 1=1";
    $params = [];

    if ($vacanteId !== '' && $vacanteId !== 'all') {
        $sql .= " AND `vacante_id` = :vacante_id";
        $params['vacante_id'] = $vacanteId;
    }

    if ($status !== '' && $status !== 'all') {
        $sql .= " AND `status` = :status";
        $params['status'] = $status;
    }

    $sql .= " ORDER BY `created_at` DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'count' => count($items),
        'items' => $items,
        'updated_at' => date('c')
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ==========================================================================
   POST: ACTUALIZAR ESTADO DE POSTULACIÓN
   ========================================================================== */
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    if (!is_array($payload) || empty($payload['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Se requiere el id de la postulación']);
        exit;
    }

    $id = (int)$payload['id'];
    $newStatus = trim($payload['status'] ?? 'revisado');

    $stmt = $pdo->prepare("UPDATE `postulaciones` SET `status` = :status WHERE `id` = :id");
    $stmt->execute([
        'status' => $newStatus,
        'id' => $id
    ]);

    echo json_encode(['success' => true, 'message' => 'Estado de postulación actualizado']);
    exit;
}

/* ==========================================================================
   DELETE: ELIMINAR REGISTRO DE POSTULACIÓN
   ========================================================================== */
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        $raw = file_get_contents('php://input');
        $pl = json_decode($raw, true);
        $id = isset($pl['id']) ? (int)$pl['id'] : 0;
    }

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID no válido']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM `postulaciones` WHERE `id` = :id");
    $stmt->execute(['id' => $id]);

    echo json_encode(['success' => true, 'message' => 'Postulación eliminada del registro']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido']);
