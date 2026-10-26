<?php
/**
 * SELOASA - API REST de Noticias y Comunicados (MySQL / PDO)
 * Almacena y consulta artículos en la tabla `noticias` de la base de datos `website`.
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
    echo json_encode(['success' => false, 'error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Proteger mutaciones de base de datos
if ($method === 'POST' || $method === 'DELETE' || $method === 'PUT') {
    if (!admin_is_authenticated()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'No autorizado: Se requiere sesión de administrador para modificar noticias.'
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
        $stmt = $pdo->prepare("SELECT * FROM `noticias` WHERE `id` = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $post = $stmt->fetch();

        if ($post) {
            $post['is_featured'] = (bool)$post['is_featured'];
            $post['pdf_enabled'] = (bool)$post['pdf_enabled'];
            $post['normativa_enabled'] = (bool)$post['normativa_enabled'];
            echo json_encode([
                'success' => true,
                'item' => $post,
                'post' => $post
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Publicación no encontrada']);
        }
        exit;
    }

    $sql = "SELECT * FROM `noticias` WHERE 1=1";
    $params = [];

    if ($status !== '' && $status !== 'all') {
        $sql .= " AND `status` = :status";
        $params['status'] = $status;
    }

    if ($type !== '' && $type !== 'all') {
        $sql .= " AND `type` = :type";
        $params['type'] = $type;
    }

    $sql .= " ORDER BY `is_featured` DESC, `created_at` DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Normalizar tipos booleanos
    $items = array_map(function ($p) {
        $p['is_featured'] = (bool)$p['is_featured'];
        $p['pdf_enabled'] = (bool)$p['pdf_enabled'];
        $p['normativa_enabled'] = (bool)$p['normativa_enabled'];
        return $p;
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
   POST: CREAR / ACTUALIZAR / SINCRONIZAR NOTICIAS
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
        INSERT INTO `noticias` (
            `id`, `type`, `category`, `badge_class`, `status`, `is_featured`,
            `title`, `summary`, `content`, `date`, `dept`, `read_time`, `image`,
            `pdf_enabled`, `pdf_title`, `pdf_url`, `pdf_btn_text`, `pdf_desc`,
            `normativa_enabled`, `normativa_title`, `normativa_items`
        ) VALUES (
            :id, :type, :category, :badge_class, :status, :is_featured,
            :title, :summary, :content, :date, :dept, :read_time, :image,
            :pdf_enabled, :pdf_title, :pdf_url, :pdf_btn_text, :pdf_desc,
            :normativa_enabled, :normativa_title, :normativa_items
        )
        ON DUPLICATE KEY UPDATE
            `type` = VALUES(`type`),
            `category` = VALUES(`category`),
            `badge_class` = VALUES(`badge_class`),
            `status` = VALUES(`status`),
            `is_featured` = VALUES(`is_featured`),
            `title` = VALUES(`title`),
            `summary` = VALUES(`summary`),
            `content` = VALUES(`content`),
            `date` = VALUES(`date`),
            `dept` = VALUES(`dept`),
            `read_time` = VALUES(`read_time`),
            `image` = VALUES(`image`),
            `pdf_enabled` = VALUES(`pdf_enabled`),
            `pdf_title` = VALUES(`pdf_title`),
            `pdf_url` = VALUES(`pdf_url`),
            `pdf_btn_text` = VALUES(`pdf_btn_text`),
            `pdf_desc` = VALUES(`pdf_desc`),
            `normativa_enabled` = VALUES(`normativa_enabled`),
            `normativa_title` = VALUES(`normativa_title`),
            `normativa_items` = VALUES(`normativa_items`),
            `updated_at` = CURRENT_TIMESTAMP
    ");

    function sanitize_post_data(array $item): array
    {
        $id = trim($item['id'] ?? '');
        if ($id === '') {
            $id = 'noticia-' . time() . '-' . substr(md5(uniqid()), 0, 5);
        }

        $type = $item['type'] ?? 'comunicado';
        $badgeClass = $item['badge_class'] ?? ($type === 'comunicado' ? 'badge-pill-comunicado' : ($type === 'noticia' ? 'badge-pill-noticia' : 'badge-pill-blog'));

        return [
            'id' => $id,
            'type' => $type,
            'category' => $item['category'] ?? ($type === 'comunicado' ? 'Comunicado Oficial' : ($type === 'noticia' ? 'Noticia Operativa' : 'Blog Farma')),
            'badge_class' => $badgeClass,
            'status' => $item['status'] ?? 'published',
            'is_featured' => !empty($item['is_featured']) ? 1 : 0,
            'title' => trim($item['title'] ?? 'Sin Título'),
            'summary' => trim($item['summary'] ?? ''),
            'content' => $item['content'] ?? '',
            'date' => $item['date'] ?? date('F Y'),
            'dept' => $item['dept'] ?? 'Dirección General & Aseguramiento de Calidad',
            'read_time' => $item['read_time'] ?? '3 min',
            'image' => $item['image'] ?? 'img/patio_unidades_dia_banner.jpg',
            'pdf_enabled' => (!isset($item['pdf_enabled']) || $item['pdf_enabled'] !== false) ? 1 : 0,
            'pdf_title' => $item['pdf_title'] ?? 'Documento Oficial PDF',
            'pdf_url' => $item['pdf_url'] ?? 'docs_pdf/protocolo_seguridad.pdf',
            'pdf_btn_text' => $item['pdf_btn_text'] ?? 'Descargar Circular en PDF',
            'pdf_desc' => $item['pdf_desc'] ?? '',
            'normativa_enabled' => (!isset($item['normativa_enabled']) || $item['normativa_enabled'] !== false) ? 1 : 0,
            'normativa_title' => $item['normativa_title'] ?? 'Marco Normativo',
            'normativa_items' => $item['normativa_items'] ?? '',
        ];
    }

    // Caso 1: Sincronización en lote { items: [...] }
    if (isset($payload['items']) && is_array($payload['items'])) {
        $savedCount = 0;
        $pdo->beginTransaction();
        try {
            // Opcional: si se envían ids actuales para reconciliar eliminados
            if (!empty($payload['replace_all'])) {
                $ids = array_filter(array_column($payload['items'], 'id'));
                if (!empty($ids)) {
                    $inClause = implode(',', array_fill(0, count($ids), '?'));
                    $delStmt = $pdo->prepare("DELETE FROM `noticias` WHERE `id` NOT IN ($inClause)");
                    $delStmt->execute(array_values($ids));
                }
            }

            foreach ($payload['items'] as $item) {
                if (is_array($item)) {
                    $params = sanitize_post_data($item);
                    $upsertStmt->execute($params);
                    $savedCount++;
                }
            }
            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => "Se guardaron {$savedCount} publicaciones en la base de datos",
                'count' => $savedCount
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al guardar lote: ' . $e->getMessage()]);
            exit;
        }
    }

    // Caso 2: Un solo artículo
    $params = sanitize_post_data($payload);
    try {
        $upsertStmt->execute($params);
        echo json_encode([
            'success' => true,
            'message' => 'Publicación guardada en la base de datos correctamente',
            'id' => $params['id']
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Error al guardar publicación: ' . $e->getMessage()]);
        exit;
    }
}

/* ==========================================================================
   DELETE: ELIMINAR NOTICIA POR ID
   ========================================================================== */
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';

    if ($id === '') {
        $rawInput = file_get_contents('php://input');
        $payload = json_decode($rawInput, true);
        $id = trim($payload['id'] ?? '');
    }

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Se requiere el parámetro id para eliminar']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM `noticias` WHERE `id` = :id");
    $stmt->execute(['id' => $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Publicación eliminada de la base de datos correctamente',
            'id' => $id
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'No se encontró la publicación a eliminar']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido']);
