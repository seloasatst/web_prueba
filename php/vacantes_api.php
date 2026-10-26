<?php
/**
 * SELOASA - API REST de Bolsa de Trabajo y Vacantes (MySQL / PDO)
 * Gestiona ofertas laborales en la tabla `vacantes` de `website`.
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

try {
    $pdo = get_db_connection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error de conexión a BD: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Proteger mutaciones de base de datos
if ($method === 'POST' || $method === 'DELETE' || $method === 'PUT') {
    if (!admin_is_authenticated()) {
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
    $isAuth = admin_is_authenticated();

    if ($id !== '') {
        $stmt = $pdo->prepare("SELECT * FROM `vacantes` WHERE `id` = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $vac = $stmt->fetch();

        if ($vac) {
            $vac['points'] = !empty($vac['points']) ? json_decode($vac['points'], true) : [];
            // Ocultar correos internos si la consulta es pública anónima
            if (!$isAuth) {
                unset($vac['recipient_emails']);
            }
            echo json_encode(['success' => true, 'item' => $vac, 'vacancy' => $vac], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Vacante no encontrada']);
        }
        exit;
    }

    $sql = "SELECT * FROM `vacantes` WHERE 1=1";
    $params = [];

    if ($status !== '' && $status !== 'all') {
        $sql .= " AND `status` = :status";
        $params['status'] = $status;
    }

    $sql .= " ORDER BY `sort_order` ASC, `created_at` DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $items = array_map(function ($v) use ($isAuth) {
        $v['points'] = !empty($v['points']) ? json_decode($v['points'], true) : [];
        if (!is_array($v['points'])) $v['points'] = [];
        if (!$isAuth) {
            unset($v['recipient_emails']);
        }
        return $v;
    }, $rows);

    echo json_encode([
        'success' => true,
        'count' => count($items),
        'items' => $items,
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
        echo json_encode(['success' => false, 'error' => 'Cuerpo JSON no válido']);
        exit;
    }

    $upsertStmt = $pdo->prepare("
        INSERT INTO `vacantes` (
            `id`, `status`, `sort_order`, `title`, `area`, `mode`, `location`,
            `schedule`, `recipient_emails`, `summary`, `points`
        ) VALUES (
            :id, :status, :sort_order, :title, :area, :mode, :location,
            :schedule, :recipient_emails, :summary, :points
        )
        ON DUPLICATE KEY UPDATE
            `status` = VALUES(`status`),
            `sort_order` = VALUES(`sort_order`),
            `title` = VALUES(`title`),
            `area` = VALUES(`area`),
            `mode` = VALUES(`mode`),
            `location` = VALUES(`location`),
            `schedule` = VALUES(`schedule`),
            `recipient_emails` = VALUES(`recipient_emails`),
            `summary` = VALUES(`summary`),
            `points` = VALUES(`points`),
            `updated_at` = CURRENT_TIMESTAMP
    ");

    function sanitize_vacancy(array $v): array
    {
        $id = trim($v['id'] ?? '');
        if ($id === '') {
            $id = 'vacante-' . time() . '-' . substr(md5(uniqid()), 0, 5);
        }

        $points = $v['points'] ?? [];
        if (is_string($points)) {
            $decoded = json_decode($points, true);
            if (is_array($decoded)) {
                $points = $decoded;
            } else {
                $points = array_values(array_filter(array_map('trim', explode("\n", $points))));
            }
        }

        return [
            'id' => $id,
            'status' => $v['status'] ?? 'published',
            'sort_order' => isset($v['sort_order']) ? (int)$v['sort_order'] : 10,
            'title' => trim($v['title'] ?? 'Puesto Vacante'),
            'area' => trim($v['area'] ?? 'Operaciones'),
            'mode' => trim($v['mode'] ?? 'Presencial'),
            'location' => trim($v['location'] ?? 'Lerma, Estado de México'),
            'schedule' => trim($v['schedule'] ?? 'Tiempo completo'),
            'recipient_emails' => trim($v['recipient_emails'] ?? 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx'),
            'summary' => trim($v['summary'] ?? ''),
            'points' => json_encode($points, JSON_UNESCAPED_UNICODE),
        ];
    }

    // Lote de vacantes
    if (isset($payload['items']) && is_array($payload['items'])) {
        $saved = 0;
        $pdo->beginTransaction();
        try {
            foreach ($payload['items'] as $item) {
                if (is_array($item)) {
                    $clean = sanitize_vacancy($item);
                    $upsertStmt->execute($clean);
                    $saved++;
                }
            }
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => "Se guardaron {$saved} vacantes en BD", 'count' => $saved]);
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit;
        }
    }

    // Guardado de una sola vacante
    $clean = sanitize_vacancy($payload);
    try {
        $upsertStmt->execute($clean);
        echo json_encode([
            'success' => true,
            'message' => 'Vacante guardada en la base de datos correctamente',
            'id' => $clean['id']
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al guardar vacante: ' . $e->getMessage()]);
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
        $pl = json_decode($raw, true);
        $id = trim($pl['id'] ?? '');
    }

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Se requiere el id de la vacante a eliminar']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM `vacantes` WHERE `id` = :id");
    $stmt->execute(['id' => $id]);

    echo json_encode(['success' => true, 'message' => 'Vacante eliminada de la base de datos', 'id' => $id]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido']);
