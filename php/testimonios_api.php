<?php
/**
 * SELOASA - API REST de Testimonios y Logos de Clientes (Almacenamiento JSON Seguro)
 * Gestiona testimonios y logos de clientes en php/storage/testimonios.json
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

// Proteger mutaciones de datos
if ($method === 'POST' || $method === 'DELETE' || $method === 'PUT') {
    if (!$isAuth) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'No autorizado: Se requiere sesión de administrador para modificar clientes y testimonios.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/* ==========================================================================
   GET: OBTENER TESTIMONIOS Y LOGOS DE CLIENTES
   ========================================================================== */
if ($method === 'GET') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';

    $store = admin_get_testimonios_store();
    $items = $store['items'];

    if ($id !== '') {
        $found = null;
        foreach ($items as $t) {
            if (strtolower(trim((string)($t['id'] ?? ''))) === strtolower($id)) {
                $found = $t;
                break;
            }
        }
        if ($found !== null) {
            echo json_encode(['success' => true, 'item' => $found], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Testimonio no encontrado'], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }

    // Filtrar por estado
    if ($status !== '' && $status !== 'all') {
        $items = array_values(array_filter($items, function ($t) use ($status) {
            return ($t['status'] ?? 'published') === $status;
        }));
    } elseif (!$isAuth) {
        // En consultas anónimas, sólo mostrar publicados
        $items = array_values(array_filter($items, function ($t) {
            return ($t['status'] ?? 'published') === 'published';
        }));
    }

    // Ordenar por campo 'order' si existe, luego por id
    usort($items, function ($a, $b) {
        $orderA = isset($a['order']) ? (int)$a['order'] : 999;
        $orderB = isset($b['order']) ? (int)$b['order'] : 999;
        return $orderA <=> $orderB;
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
   POST: CREAR / ACTUALIZAR TESTIMONIOS
   ========================================================================== */
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cuerpo de solicitud JSON no válido'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $store = admin_get_testimonios_store();
    $currentItems = $store['items'];

    // Caso A: Reemplazo masivo (ej: ordenamiento o sincronización)
    if (isset($data['items']) && is_array($data['items'])) {
        $newItems = [];
        foreach ($data['items'] as $idx => $t) {
            if (!is_array($t)) continue;
            $company = trim((string)($t['company'] ?? ''));
            if ($company === '') continue;

            $id = trim((string)($t['id'] ?? ''));
            if ($id === '') {
                $id = strtolower(preg_replace('/[^a-zA-Z0-9_\-]+/', '-', $company));
                $id = trim($id, '-');
            }

            $newItems[] = [
                'id' => $id,
                'company' => $company,
                'logo' => trim((string)($t['logo'] ?? 'img/logos/RALCA.png')),
                'role' => trim((string)($t['role'] ?? 'Cliente')),
                'text' => trim((string)($t['text'] ?? '')),
                'status' => in_array($t['status'] ?? '', ['published', 'draft'], true) ? $t['status'] : 'published',
                'order' => isset($t['order']) ? (int)$t['order'] : ($idx + 1),
                'created_at' => $t['created_at'] ?? date('c'),
                'updated_at' => date('c'),
            ];
        }

        admin_save_testimonios_store($newItems);
        echo json_encode(['success' => true, 'count' => count($newItems), 'items' => $newItems], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // Caso B: Guardar un solo testimonio (crear o editar)
    $payload = $data['item'] ?? $data;
    $company = trim((string)($payload['company'] ?? ''));

    if ($company === '') {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'El nombre de la empresa / cliente es obligatorio'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = trim((string)($payload['id'] ?? ''));
    if ($id === '') {
        $id = strtolower(preg_replace('/[^a-zA-Z0-9_\-]+/', '-', $company));
        $id = trim($id, '-');
        if ($id === '') $id = 'cliente-' . uniqid();
    }

    $itemData = [
        'id' => $id,
        'company' => $company,
        'logo' => trim((string)($payload['logo'] ?? 'img/logos/RALCA.png')),
        'role' => trim((string)($payload['role'] ?? 'Cliente')),
        'text' => trim((string)($payload['text'] ?? '')),
        'status' => in_array($payload['status'] ?? '', ['published', 'draft'], true) ? $payload['status'] : 'published',
        'order' => isset($payload['order']) ? (int)$payload['order'] : (count($currentItems) + 1),
        'updated_at' => date('c'),
    ];

    $existingIndex = -1;
    foreach ($currentItems as $idx => $item) {
        if (strtolower(trim((string)($item['id'] ?? ''))) === strtolower($id)) {
            $existingIndex = $idx;
            break;
        }
    }

    if ($existingIndex >= 0) {
        $itemData['created_at'] = $currentItems[$existingIndex]['created_at'] ?? date('c');
        $currentItems[$existingIndex] = $itemData;
    } else {
        $itemData['created_at'] = date('c');
        $currentItems[] = $itemData;
    }

    admin_save_testimonios_store($currentItems);

    echo json_encode([
        'success' => true,
        'message' => $existingIndex >= 0 ? 'Testimonio actualizado con éxito.' : 'Testimonio creado con éxito.',
        'item' => $itemData,
        'items' => $currentItems
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ==========================================================================
   DELETE: ELIMINAR TESTIMONIO
   ========================================================================== */
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    if ($id === '') {
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);
        $id = trim((string)($data['id'] ?? ''));
    }

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Se requiere el identificador (id) para eliminar'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $store = admin_get_testimonios_store();
    $currentItems = $store['items'];
    $filtered = array_values(array_filter($currentItems, function ($item) use ($id) {
        return strtolower(trim((string)($item['id'] ?? ''))) !== strtolower($id);
    }));

    if (count($filtered) === count($currentItems)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Testimonio no encontrado para eliminar'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    admin_save_testimonios_store($filtered);

    echo json_encode([
        'success' => true,
        'message' => 'Testimonio eliminado exitosamente.',
        'count' => count($filtered),
        'items' => $filtered
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

