<?php
/**
 * SELOASA - API REST de Noticias y Comunicados (Almacenamiento JSON Seguro)
 * Gestiona artículos y comunicados en php/storage/noticias.json
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
            'error' => 'No autorizado: Se requiere sesión de administrador para modificar noticias y comunicados.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/* ==========================================================================
   GET: OBTENER NOTICIAS / COMUNICADOS
   ========================================================================== */
if ($method === 'GET') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';
    $type = isset($_GET['type']) ? trim($_GET['type']) : '';

    if ($id !== '') {
        $post = admin_find_post_by_id($id);
        if ($post !== null) {
            $post['is_featured'] = !empty($post['is_featured']);
            $post['pdf_enabled'] = !isset($post['pdf_enabled']) || !empty($post['pdf_enabled']);
            $post['normativa_enabled'] = !isset($post['normativa_enabled']) || !empty($post['normativa_enabled']);
            echo json_encode([
                'success' => true,
                'item' => $post,
                'post' => $post
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Publicación no encontrada'], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }

    $store = admin_get_posts_store();
    $items = $store['items'];

    // Filtrar por estado si se solicita
    if ($status !== '' && $status !== 'all') {
        $items = array_values(array_filter($items, function ($p) use ($status) {
            return ($p['status'] ?? 'draft') === $status;
        }));
    } elseif (!$isAuth) {
        // En consultas anónimas sin filtro explícito, sólo mostrar publicadas
        $items = array_values(array_filter($items, function ($p) {
            return ($p['status'] ?? 'draft') === 'published';
        }));
    }

    // Filtrar por tipo si se solicita
    if ($type !== '' && $type !== 'all') {
        $items = array_values(array_filter($items, function ($p) use ($type) {
            return ($p['type'] ?? '') === $type;
        }));
    }

    // Ordenar: destacados primero, luego fecha más reciente
    usort($items, function ($a, $b) {
        $featA = !empty($a['is_featured']) ? 1 : 0;
        $featB = !empty($b['is_featured']) ? 1 : 0;
        if ($featA !== $featB) {
            return $featB <=> $featA;
        }
        $timeA = strtotime($a['created_at'] ?? $a['date'] ?? 'now');
        $timeB = strtotime($b['created_at'] ?? $b['date'] ?? 'now');
        return $timeB <=> $timeA;
    });

    // Normalizar booleanos
    $items = array_map(function ($p) {
        $p['is_featured'] = !empty($p['is_featured']);
        $p['pdf_enabled'] = !isset($p['pdf_enabled']) || !empty($p['pdf_enabled']);
        $p['normativa_enabled'] = !isset($p['normativa_enabled']) || !empty($p['normativa_enabled']);
        return $p;
    }, $items);

    echo json_encode([
        'success' => true,
        'count' => count($items),
        'items' => $items,
        'updated_at' => $store['updated_at'] ?? date('c')
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* ==========================================================================
   POST: CREAR / ACTUALIZAR NOTICIAS
   ========================================================================== */
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cuerpo JSON no válido'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $store = admin_get_posts_store();
    $currentItems = $store['items'];

    // Caso 1: Sincronización masiva de array de items
    if (isset($payload['items']) && is_array($payload['items'])) {
        $validItems = [];
        foreach ($payload['items'] as $item) {
            if (!is_array($item) || empty($item['id'])) {
                continue;
            }
            $item['updated_at'] = $item['updated_at'] ?? date('c');
            $validItems[] = $item;
        }
        if (admin_save_posts_store($validItems)) {
            echo json_encode([
                'success' => true,
                'message' => 'Noticias sincronizadas correctamente.',
                'count' => count($validItems)
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al guardar archivo JSON'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Caso 2: Upsert de un solo post
    $post = isset($payload['item']) && is_array($payload['item']) ? $payload['item'] : $payload;
    $id = trim((string) ($post['id'] ?? ''));

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El id de la publicación es obligatorio'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $post['updated_at'] = date('c');
    if (empty($post['created_at'])) {
        $post['created_at'] = date('c');
    }

    $foundIndex = -1;
    foreach ($currentItems as $idx => $existing) {
        if (strtolower(trim((string) ($existing['id'] ?? ''))) === strtolower($id)) {
            $foundIndex = $idx;
            break;
        }
    }

    if ($foundIndex >= 0) {
        $currentItems[$foundIndex] = array_merge($currentItems[$foundIndex], $post);
    } else {
        array_unshift($currentItems, $post);
    }

    if (admin_save_posts_store($currentItems)) {
        echo json_encode([
            'success' => true,
            'message' => 'Publicación guardada correctamente.',
            'item' => $post
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al escribir noticias.json'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/* ==========================================================================
   DELETE: ELIMINAR NOTICIA
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
        echo json_encode(['success' => false, 'error' => 'Se requiere el id de la publicación a eliminar'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $store = admin_get_posts_store();
    $items = $store['items'];
    $filtered = array_values(array_filter($items, function ($p) use ($id) {
        return strtolower(trim((string) ($p['id'] ?? ''))) !== strtolower($id);
    }));

    if (count($filtered) === count($items)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Publicación no encontrada para eliminar'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (admin_save_posts_store($filtered)) {
        echo json_encode(['success' => true, 'message' => 'Publicación eliminada correctamente.'], JSON_UNESCAPED_UNICODE);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al actualizar noticias.json'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
