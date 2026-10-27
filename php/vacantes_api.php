<?php
/**
 * SELOASA - API REST de Bolsa de Trabajo y Vacantes (Almacenamiento JSON Seguro)
 * Gestiona ofertas laborales en php/storage/vacancies.json
 */

require_once __DIR__ . '/admin_helper.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin === 'null') {
    header('Access-Control-Allow-Origin: null');
    header('Access-Control-Allow-Credentials: true');
} elseif ($origin === '') {
    header('Access-Control-Allow-Origin: *');
} elseif (preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin) || ($host !== '' && str_contains($origin, $host))) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token, X-Admin-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$isAuth = admin_is_authenticated();

// Proteger mutaciones de base de datos / archivos
if ($method === 'POST' || $method === 'DELETE' || $method === 'PUT') {
    if (!$isAuth) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'No autorizado: Se requiere sesión de administrador para modificar vacantes.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/* ==========================================================================
   GET: OBTENER VACANTES
   ========================================================================== */
if ($method === 'GET') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';

    if ($id !== '') {
        $vac = admin_find_vacancy_by_id($id);
        if ($vac !== null) {
            $vac['points'] = !empty($vac['points']) && is_array($vac['points']) ? $vac['points'] : [];
            // Ocultar correos internos si la consulta es pública anónima
            if (!$isAuth) {
                unset($vac['recipient_emails']);
            }
            echo json_encode(['success' => true, 'item' => $vac, 'vacancy' => $vac], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Vacante no encontrada'], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }

    $items = admin_get_all_vacancies();

    if ($status !== '' && $status !== 'all') {
        $items = array_values(array_filter($items, function ($v) use ($status) {
            return ($v['status'] ?? 'draft') === $status;
        }));
    } elseif (!$isAuth) {
        $items = array_values(array_filter($items, function ($v) {
            return ($v['status'] ?? 'draft') === 'published';
        }));
    }

    $sanitized = array_map(function ($v) use ($isAuth) {
        $v['points'] = !empty($v['points']) && is_array($v['points']) ? $v['points'] : [];
        if (!$isAuth) {
            unset($v['recipient_emails']);
        }
        return $v;
    }, $items);

    echo json_encode([
        'success' => true,
        'count' => count($sanitized),
        'items' => $sanitized,
        'updated_at' => date('c')
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ==========================================================================
   POST: CREAR / ACTUALIZAR VACANTES
   ========================================================================== */
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cuerpo JSON no válido'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Caso 1: Sincronización masiva de array
    if (isset($payload['items']) && is_array($payload['items'])) {
        $validItems = [];
        foreach ($payload['items'] as $item) {
            if (!is_array($item) || empty($item['id'])) continue;
            $item['updated_at'] = $item['updated_at'] ?? date('c');
            $validItems[] = $item;
        }
        if (admin_save_vacancy_store($validItems)) {
            echo json_encode([
                'success' => true,
                'message' => 'Vacantes sincronizadas correctamente.',
                'count' => count($validItems)
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al guardar archivo vacancies.json'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Caso 2: Upsert individual
    $item = isset($payload['item']) && is_array($payload['item']) ? $payload['item'] : $payload;
    $id = trim((string) ($item['id'] ?? ''));

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El id de la vacante es obligatorio'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $currentItems = admin_get_all_vacancies();
    $foundIndex = -1;
    foreach ($currentItems as $idx => $existing) {
        if (strtolower(trim((string) ($existing['id'] ?? ''))) === strtolower($id)) {
            $foundIndex = $idx;
            break;
        }
    }

    $item['updated_at'] = date('c');
    if (empty($item['created_at'])) {
        $item['created_at'] = date('c');
    }

    if ($foundIndex >= 0) {
        $currentItems[$foundIndex] = array_merge($currentItems[$foundIndex], $item);
    } else {
        $currentItems[] = $item;
    }

    if (admin_save_vacancy_store($currentItems)) {
        echo json_encode([
            'success' => true,
            'message' => 'Vacante guardada correctamente.',
            'item' => $item
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al escribir vacancies.json'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/* ==========================================================================
   DELETE: ELIMINAR VACANTE
   ========================================================================== */
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    if ($id === '') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $id = trim((string) ($data['id'] ?? ''));
    }

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Se requiere el id de la vacante'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (admin_delete_vacancy($id)) {
        echo json_encode(['success' => true, 'message' => 'Vacante eliminada correctamente.'], JSON_UNESCAPED_UNICODE);
        exit;
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'No se encontró la vacante para eliminar'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
