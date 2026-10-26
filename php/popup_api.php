<?php
/**
 * SELOASA - API REST de Pop-ups y Avisos Emergentes (MySQL / PDO)
 * Gestiona avisos y ventanas emergentes en la tabla `popups` de `website`.
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
            'error' => 'No autorizado: Se requiere sesión de administrador para modificar pop-ups.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/* ==========================================================================
   GET: OBTENER POP-UPS
   ========================================================================== */
if ($method === 'GET') {
    // Caso 1: Obtener el popup activo para la web pública
    if (isset($_GET['active']) && $_GET['active'] == '1') {
        $stmt = $pdo->prepare("SELECT * FROM `popups` WHERE `active` = 1 ORDER BY `updated_at` DESC LIMIT 1");
        $stmt->execute();
        $popup = $stmt->fetch();

        if ($popup) {
            $popup['active'] = (bool)$popup['active'];
            $popup['btn_primary_enabled'] = (bool)$popup['btn_primary_enabled'];
            $popup['btn_secondary_enabled'] = (bool)$popup['btn_secondary_enabled'];
            $popup['delay'] = (float)$popup['delay'];
            echo json_encode(['success' => true, 'popup' => $popup, 'item' => $popup], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            echo json_encode(['success' => true, 'popup' => null, 'item' => null]);
        }
        exit;
    }

    // Caso 2: Obtener por ID
    $id = isset($_GET['id']) ? trim($_GET['id']) : '';
    if ($id !== '') {
        $stmt = $pdo->prepare("SELECT * FROM `popups` WHERE `id` = :id LIMIT 1");
        $stmt->execute(['id' => $id]);
        $popup = $stmt->fetch();

        if ($popup) {
            $popup['active'] = (bool)$popup['active'];
            $popup['btn_primary_enabled'] = (bool)$popup['btn_primary_enabled'];
            $popup['btn_secondary_enabled'] = (bool)$popup['btn_secondary_enabled'];
            $popup['delay'] = (float)$popup['delay'];
            echo json_encode(['success' => true, 'item' => $popup, 'popup' => $popup], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Pop-up no encontrado']);
        }
        exit;
    }

    // Caso 3: Listar todos
    $stmt = $pdo->query("SELECT * FROM `popups` ORDER BY `active` DESC, `updated_at` DESC");
    $rows = $stmt->fetchAll();

    $items = array_map(function ($p) {
        $p['active'] = (bool)$p['active'];
        $p['btn_primary_enabled'] = (bool)$p['btn_primary_enabled'];
        $p['btn_secondary_enabled'] = (bool)$p['btn_secondary_enabled'];
        $p['delay'] = (float)$p['delay'];
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
   POST: CREAR / ACTUALIZAR / ACTIVAR POP-UP
   ========================================================================== */
if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cuerpo JSON no válido']);
        exit;
    }

    // Acción rápida: Activar un ID específico
    if (isset($payload['activate_id'])) {
        $actId = trim($payload['activate_id']);
        $pdo->beginTransaction();
        try {
            $pdo->exec("UPDATE `popups` SET `active` = 0");
            if ($actId !== '') {
                $st = $pdo->prepare("UPDATE `popups` SET `active` = 1 WHERE `id` = :id");
                $st->execute(['id' => $actId]);
            }
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Estado activo actualizado correctamente']);
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit;
        }
    }

    $upsertStmt = $pdo->prepare("
        INSERT INTO `popups` (
            `id`, `title`, `subtitle`, `type`, `layout`, `message`, `image`,
            `btn_primary_enabled`, `btn_primary_text`, `btn_primary_url`,
            `btn_secondary_enabled`, `btn_secondary_text`, `custom_footer`,
            `active`, `frequency`, `delay`
        ) VALUES (
            :id, :title, :subtitle, :type, :layout, :message, :image,
            :btn_primary_enabled, :btn_primary_text, :btn_primary_url,
            :btn_secondary_enabled, :btn_secondary_text, :custom_footer,
            :active, :frequency, :delay
        )
        ON DUPLICATE KEY UPDATE
            `title` = VALUES(`title`),
            `subtitle` = VALUES(`subtitle`),
            `type` = VALUES(`type`),
            `layout` = VALUES(`layout`),
            `message` = VALUES(`message`),
            `image` = VALUES(`image`),
            `btn_primary_enabled` = VALUES(`btn_primary_enabled`),
            `btn_primary_text` = VALUES(`btn_primary_text`),
            `btn_primary_url` = VALUES(`btn_primary_url`),
            `btn_secondary_enabled` = VALUES(`btn_secondary_enabled`),
            `btn_secondary_text` = VALUES(`btn_secondary_text`),
            `custom_footer` = VALUES(`custom_footer`),
            `active` = VALUES(`active`),
            `frequency` = VALUES(`frequency`),
            `delay` = VALUES(`delay`),
            `updated_at` = CURRENT_TIMESTAMP
    ");

    function sanitize_popup(array $p): array
    {
        $id = trim($p['id'] ?? '');
        if ($id === '') {
            $id = 'popup-' . time() . '-' . substr(md5(uniqid()), 0, 5);
        }

        $btnPrimaryEnabled = isset($p['btn_primary_enabled']) ? ($p['btn_primary_enabled'] ? 1 : 0) : (trim($p['btn_primary_text'] ?? '') !== '' ? 1 : 0);
        $btnSecondaryEnabled = isset($p['btn_secondary_enabled']) ? ($p['btn_secondary_enabled'] ? 1 : 0) : (trim($p['btn_secondary_text'] ?? '') !== '' ? 1 : 0);

        return [
            'id' => $id,
            'title' => trim($p['title'] ?? 'Aviso Oficial'),
            'subtitle' => trim($p['subtitle'] ?? ''),
            'type' => $p['type'] ?? 'alerta',
            'layout' => $p['layout'] ?? 'top',
            'message' => $p['message'] ?? '',
            'image' => $p['image'] ?? 'img/patio_unidades_dia_banner.jpg',
            'btn_primary_enabled' => $btnPrimaryEnabled,
            'btn_primary_text' => trim($p['btn_primary_text'] ?? ''),
            'btn_primary_url' => trim($p['btn_primary_url'] ?? ''),
            'btn_secondary_enabled' => $btnSecondaryEnabled,
            'btn_secondary_text' => trim($p['btn_secondary_text'] ?? ''),
            'custom_footer' => $p['custom_footer'] ?? '',
            'active' => !empty($p['active']) ? 1 : 0,
            'frequency' => $p['frequency'] ?? 'session',
            'delay' => isset($p['delay']) ? (float)$p['delay'] : 1.5,
        ];
    }

    // Sincronización en lote
    if (isset($payload['items']) && is_array($payload['items'])) {
        $saved = 0;
        $pdo->beginTransaction();
        try {
            foreach ($payload['items'] as $item) {
                if (is_array($item)) {
                    $clean = sanitize_popup($item);
                    $upsertStmt->execute($clean);
                    $saved++;
                }
            }
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => "Se guardaron {$saved} pop-ups en BD", 'count' => $saved]);
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit;
        }
    }

    // Guardado de un solo pop-up
    $clean = sanitize_popup($payload);
    $pdo->beginTransaction();
    try {
        // Si este popup se marca como activo, desactivar los demás para mantener uno activo
        if ($clean['active'] === 1) {
            $pdo->exec("UPDATE `popups` SET `active` = 0");
        }

        $upsertStmt->execute($clean);
        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Pop-up guardado en la base de datos correctamente',
            'id' => $clean['id']
        ]);
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
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
        $pl = json_decode($raw, true);
        $id = trim($pl['id'] ?? '');
    }

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Se requiere el id del pop-up a eliminar']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM `popups` WHERE `id` = :id");
    $stmt->execute(['id' => $id]);

    echo json_encode(['success' => true, 'message' => 'Pop-up eliminado de la base de datos']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido']);
