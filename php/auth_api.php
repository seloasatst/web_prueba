<?php
/**
 * SELOASA - API de Autenticación Segura & 2FA (Backend)
 * Valida credenciales con bcrypt y códigos TOTP en el servidor.
 * Protege contra fuerza bruta y genera sesiones seguras HttpOnly.
 */

ini_set('display_errors', '0');
error_reporting(E_ALL);
ob_start();

require_once __DIR__ . '/admin_helper.php';

// Limpiar cualquier salida accidental previa a los encabezados
if (ob_get_length()) {
    ob_clean();
}

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// CORS robusto para desarrollo local, file:// y producción
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
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

admin_start_session();

$action = trim((string) ($_GET['action'] ?? $_POST['action'] ?? 'check'));
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$adminEmail = admin_env('ADMIN_EMAIL', 'admin@seloasa.com.mx');
$adminPasswordHash = admin_env('ADMIN_PASSWORD_HASH', '');
$adminTotpSecret = admin_totp_secret();
if ($adminTotpSecret === '') {
    $adminTotpSecret = 'JBSWY3DPEHPK3PXP';
}

/* ==========================================================================
   GET: VERIFICAR SESIÓN ACTIVA (CHECK)
   ========================================================================== */
if ($action === 'check') {
    $isAuth = admin_is_authenticated();
    echo json_encode([
        'success' => true,
        'authenticated' => $isAuth,
        'user' => $isAuth ? [
            'email' => $_SESSION['admin_user'] ?? $adminEmail,
            'authenticated_at' => $_SESSION['admin_authenticated_at'] ?? null,
        ] : null,
        'csrf_token' => $isAuth ? ($_SESSION['admin_csrf_token'] ?? '') : null
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ==========================================================================
   GET: OBTENER LISTA DE CORREOS AUTORIZADOS
   ========================================================================== */
if ($action === 'get_allowed_emails') {
    if (!admin_is_authenticated()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No autorizado']);
        exit;
    }
    echo json_encode([
        'success' => true,
        'emails' => admin_get_allowed_emails(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ==========================================================================
   POST: PASO 1 - AUTENTICACIÓN CON CONTRASEÑA O TOKEN MAESTRO (.ENV)
   Valida correo y contraseña/token contra las variables de entorno.
   Al ser válido, autoriza de inmediato el acceso al Paso 2 (Google 2FA).
   ========================================================================== */
if (($action === 'login_step1' || $action === 'request_email_code' || $action === 'verify_token') && $method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $email = strtolower(trim((string) ($payload['email'] ?? '')));
    $password = trim((string) ($payload['password'] ?? $payload['token'] ?? ''));

    // 1. Verificar bloqueo por fuerza bruta
    $status = admin_login_attempt_status();
    if (!empty($status['blocked'])) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'blocked' => true,
            'error' => "Demasiados intentos fallidos. Bloqueado por seguridad durante {$status['seconds']} segundos."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($password === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Ingresa tu contraseña o token de acceso.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. Verificar credencial contra .env
    $envPassword = mail_env('ADMIN_PASSWORD', '');
    $envToken = mail_env('ADMIN_ACCESS_TOKEN', '');
    $envHash = mail_env('ADMIN_PASSWORD_HASH', '');

    $isValid = false;
    if ($envPassword !== '' && hash_equals($envPassword, $password)) {
        $isValid = true;
    } elseif ($envToken !== '' && hash_equals($envToken, $password)) {
        $isValid = true;
    } elseif ($envHash !== '' && password_verify($password, $envHash)) {
        $isValid = true;
    }

    if (!$isValid) {
        admin_register_login_failure();
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Contraseña o token de acceso incorrecto.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 3. Credencial válida: Registrar Paso 1 superado para permitir Google 2FA
    $targetEmail = $email ?: mail_env('ADMIN_EMAIL', 'admin@seloasa.com.mx');
    $_SESSION['auth_step1_passed'] = true;
    $_SESSION['auth_step1_time'] = time();
    $_SESSION['auth_step1_email'] = $targetEmail;

    @file_put_contents(ADMIN_STORAGE_DIR . '/admin_step1_passed.json', json_encode([
        'passed' => true,
        'time' => time(),
        'email' => $targetEmail
    ], JSON_PRETTY_PRINT));

    echo json_encode([
        'success' => true,
        'step' => 2,
        'email' => $targetEmail,
        'message' => 'Contraseña verificada correctamente. Ingresa tu código de Google Authenticator.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ==========================================================================
   POST: PASO 1B - VERIFICACIÓN DEL CÓDIGO DE 6 DÍGITOS DEL CORREO
   Válido solo si no han pasado 10 minutos. Al ser válido, pasa al paso de Google 2FA.
   ========================================================================== */
if ($action === 'verify_email_code' && $method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $email = strtolower(trim((string) ($payload['email'] ?? '')));
    $code = preg_replace('/\D/', '', (string) ($payload['code'] ?? ''));

    // 1. Verificar bloqueo por fuerza bruta
    $status = admin_login_attempt_status();
    if (!empty($status['blocked'])) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'blocked' => true,
            'error' => "Demasiados intentos fallidos. Bloqueado por seguridad durante {$status['seconds']} segundos."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (strlen($code) !== 6) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Ingresa los 6 dígitos del código enviado a tu correo.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. Validar OTP y vigencia de 10 minutos
    $verifyResult = admin_verify_email_otp($email, $code);

    if (empty($verifyResult['valid'])) {
        admin_register_login_failure();
        $httpCode = !empty($verifyResult['expired']) ? 400 : 401;
        http_response_code($httpCode);
        echo json_encode([
            'success' => false,
            'expired' => !empty($verifyResult['expired']),
            'error' => $verifyResult['error'] ?? 'Código de correo incorrecto o expirado.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Paso 1 completado exitosamente: continuar al código de Google Authenticator
    echo json_encode([
        'success' => true,
        'step' => 2,
        'email' => $email,
        'message' => 'Código de correo verificado correctamente. Ahora ingresa tu código de Google Authenticator.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ==========================================================================
   POST: PASO 2 - VALIDACIÓN DEL CÓDIGO DE GOOGLE AUTHENTICATOR (2FA)
   ========================================================================== */
if ($action === 'login_step2' && $method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $code = preg_replace('/\D/', '', trim((string) ($payload['code'] ?? '')));
    $remember = !empty($payload['remember']);

    // Verificar que el Paso 1 (correo verificado) se haya completado en los últimos 600 segundos (10 min)
    $step1Passed = !empty($_SESSION['auth_step1_passed']);
    $step1Time = (int) ($_SESSION['auth_step1_time'] ?? 0);
    $step1Email = (string) ($_SESSION['auth_step1_email'] ?? '');

    if (!$step1Passed || (time() - $step1Time) > 600) {
        $step1File = ADMIN_STORAGE_DIR . '/admin_step1_passed.json';
        if (is_file($step1File)) {
            $step1Data = json_decode((string) file_get_contents($step1File), true);
            if (is_array($step1Data) && !empty($step1Data['passed']) && (time() - (int) ($step1Data['time'] ?? 0)) <= 600) {
                $step1Passed = true;
                $step1Time = (int) $step1Data['time'];
                $step1Email = (string) ($step1Data['email'] ?? '');
            }
        }
    }

    if (!$step1Passed || (time() - $step1Time) > 600) {
        unset($_SESSION['auth_step1_passed'], $_SESSION['auth_step1_time'], $_SESSION['auth_step1_email']);
        @unlink(ADMIN_STORAGE_DIR . '/admin_step1_passed.json');
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'La sesión de verificación por correo expiró (vigencia de 10 minutos). Solicita un nuevo código.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Verificar código TOTP de 6 dígitos
    $isTotpValid = admin_verify_totp($adminTotpSecret, $code, 1);

    if (!$isTotpValid) {
        admin_register_login_failure();
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Código de verificación incorrecto o expirado. Revisa tu aplicación Google Authenticator.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Autenticación exitosa completa
    admin_clear_login_failures();
    unset($_SESSION['auth_step1_passed'], $_SESSION['auth_step1_time']);

    // Regenerar ID de sesión para prevenir Session Fixation
    session_regenerate_id(true);

    $_SESSION['admin_authenticated'] = true;
    $_SESSION['admin_user'] = $_SESSION['auth_step1_email'] ?? $adminEmail;
    $_SESSION['admin_fingerprint'] = admin_session_fingerprint();
    $_SESSION['admin_authenticated_at'] = date('c');
    $_SESSION['admin_csrf_token'] = bin2hex(random_bytes(32));

    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'csrf_token' => $_SESSION['admin_csrf_token'],
        'message' => 'Autenticación en dos pasos exitosa. Bienvenido al panel de administración.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ==========================================================================
   POST: CERRAR SESIÓN (LOGOUT)
   ========================================================================== */
if ($action === 'logout') {
    admin_logout();
    echo json_encode([
        'success' => true,
        'authenticated' => false,
        'message' => 'Sesión cerrada correctamente.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Acción no reconocida'], JSON_UNESCAPED_UNICODE);
