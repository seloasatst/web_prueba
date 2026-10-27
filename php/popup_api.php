<?php
/**
 * SELOASA - API REST de Pop-ups y Avisos Emergentes (Almacenamiento JSON Seguro)
 * Gestiona avisos y ventanas emergentes en php/storage/popups.json
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
            'error' => 'No autorizado: Se requiere sesión de administrador para modificar pop-ups.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/* ==========================================================================
   GET: OBTENER POP-UPS
   ========================================================================== */
if ($method === 'GET') {
    $store = admin_get_popups_store();
    $items = $store['items'];

    // Caso 1: Obtener el popup activo para la web pública
    if (isset($_GET['active']) && $_GET['active'] == '1') {
        $activePopup = null;
        foreach ($items as $p) {
            if (!empty($p['active'])) {
                $activePopup = $p;
                break;
            }
        }

        if ($activePopup !== null) {
            $activePopup['active'] = true;
            $activePopup['btn_primary_enabled'] = !empty($activePopup['btn_primary_text']);
            $activePopup['btn_secondary_enabled'] = !empty($activePopup['btn_secondary_text']);
            $activePopup['delay'] = (float)($activePopup['delay'] ?? 1.5);
            echo json_encode([
                'success' => true,
                'popup' => $activePopup,
                'item' => $activePopup
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            echo json_encode(['success' => true, 'popup' => null, 'item' => null]);
        }
        exit;
    }

    // Caso 2: Obtener por ID
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    if ($id !== '') {
        $popup = admin_find_popup_by_id($id);
        if ($popup !== null) {
            $popup['active'] = !empty($popup['active']);
            $popup['btn_primary_enabled'] = !empty($popup['btn_primary_text']);
            $popup['btn_secondary_enabled'] = !empty($popup['btn_secondary_text']);
            $popup['delay'] = (float)($popup['delay'] ?? 1.5);
            echo json_encode([
                'success' => true,
                'item' => $popup,
                'popup' => $popup
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Pop-up no encontrado'], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }

    // Caso 3: Listar todos
    $normalized = array_map(function ($p) {
        $p['active'] = !empty($p['active']);
        $p['btn_primary_enabled'] = !empty($p['btn_primary_text']);
        $p['btn_secondary_enabled'] = !empty($p['btn_secondary_text']);
        $p['delay'] = (float)($p['delay'] ?? 1.5);
        return $p;
    }, $items);

    echo json_encode([
        'success' => true,
        'count' => count($normalized),
        'items' => $normalized,
        'updated_at' => $store['updated_at'] ?? date('c')
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ==========================================================================
   POST: CREAR / ACTUALIZAR / ACTIVAR POP-UP
   ========================================================================== */
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cuerpo JSON no válido'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $store = admin_get_popups_store();
    $currentItems = $store['items'];

    // Acción rápida: Activar un ID específico y desactivar los demás
    if (isset($payload['activate_id'])) {
        $actId = trim((string) $payload['activate_id']);
        foreach ($currentItems as $idx => $item) {
            $currentItems[$idx]['active'] = (strtolower(trim((string) ($item['id'] ?? ''))) === strtolower($actId));
            if ($currentItems[$idx]['active']) {
                $currentItems[$idx]['updated_at'] = date('c');
            }
        }
        admin_save_popups_store($currentItems);
        echo json_encode(['success' => true, 'message' => 'Estado activo actualizado correctamente'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Caso de array de items
    if (isset($payload['items']) && is_array($payload['items'])) {
        $validItems = [];
        foreach ($payload['items'] as $item) {
            if (!is_array($item) || empty($item['id'])) continue;
            $item['updated_at'] = $item['updated_at'] ?? date('c');
            $validItems[] = $item;
        }
        if (admin_save_popups_store($validItems)) {
            echo json_encode([
                'success' => true,
                'message' => 'Pop-ups sincronizados correctamente.',
                'count' => count($validItems)
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al guardar archivo popups.json'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Upsert individual
    $item = isset($payload['item']) && is_array($payload['item']) ? $payload['item'] : $payload;
    $id = trim((string) ($item['id'] ?? ''));

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El id del pop-up es obligatorio'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $item['updated_at'] = date('c');
    if (empty($item['created_at'])) {
        $item['created_at'] = date('c');
    }

    // Si este popup se marca activo, desactivar los demás
    if (!empty($item['active'])) {
        foreach ($currentItems as $idx => $existing) {
            $currentItems[$idx]['active'] = false;
        }
    }

    $foundIndex = -1;
    foreach ($currentItems as $idx => $existing) {
        if (strtolower(trim((string) ($existing['id'] ?? ''))) === strtolower($id)) {
            $foundIndex = $idx;
            break;
        }
    }

    if ($foundIndex >= 0) {
        $currentItems[$foundIndex] = array_merge($currentItems[$foundIndex], $item);
    } else {
        array_unshift($currentItems, $item);
    }

    if (admin_save_popups_store($currentItems)) {
        echo json_encode([
            'success' => true,
            'message' => 'Pop-up guardado correctamente.',
            'item' => $item
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al escribir popups.json'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/* ==========================================================================
   DELETE: ELIMINAR POP-UP
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
        echo json_encode(['success' => false, 'error' => 'Se requiere el id del pop-up'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $store = admin_get_popups_store();
    $items = $store['items'];
    $filtered = array_values(array_filter($items, function ($p) use ($id) {
        return strtolower(trim((string) ($p['id'] ?? ''))) !== strtolower($id);
    }));

    if (count($filtered) === count($items)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Pop-up no encontrado para eliminar'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (admin_save_popups_store($filtered)) {
        echo json_encode(['success' => true, 'message' => 'Pop-up eliminado correctamente.'], JSON_UNESCAPED_UNICODE);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al actualizar popups.json'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
