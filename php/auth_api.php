<?php
/**
 * SELOASA - API de Autenticación Segura & 2FA (Backend)
 * Valida credenciales con bcrypt y códigos TOTP en el servidor.
 * Protege contra fuerza bruta y genera sesiones seguras HttpOnly.
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/admin_helper.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// CORS restringido al mismo origen
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && str_contains($origin, $host)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

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
   POST: PASO 1 - VALIDACIÓN DE EMAIL Y CONTRASEÑA
   ========================================================================== */
if ($action === 'login_step1' && $method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $email = trim((string) ($payload['email'] ?? ''));
    $password = (string) ($payload['password'] ?? '');

    // 1. Verificar bloqueo por intentos fallidos
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

    if ($email === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Ingresa tu correo y contraseña.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. Validar correo
    $isEmailValid = (strcasecmp($email, $adminEmail) === 0);

    // 3. Validar contraseña (bcrypt hash o fallback seguro)
    $isPasswordValid = false;
    if ($adminPasswordHash !== '' && str_starts_with($adminPasswordHash, '$2y$')) {
        $isPasswordValid = password_verify($password, $adminPasswordHash);
    } else {
        // Fallback por si la variable tiene contraseña en texto plano en .env
        $fallbackPass = admin_env('ADMIN_PASSWORD', 'Seloasa2026!');
        $isPasswordValid = hash_equals($fallbackPass, $password);
    }

    if (!$isEmailValid || !$isPasswordValid) {
        admin_register_login_failure();
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Correo o contraseña incorrectos. Verifica tus credenciales.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Paso 1 superado: registrar en sesión temporal (expira en 5 minutos)
    $_SESSION['auth_step1_passed'] = true;
    $_SESSION['auth_step1_time'] = time();
    $_SESSION['auth_step1_email'] = $email;

    echo json_encode([
        'success' => true,
        'step' => 2,
        'message' => 'Credenciales verificadas. Ingresa tu código de 6 dígitos de Google Authenticator.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ==========================================================================
   POST: PASO 2 - VALIDACIÓN DEL CÓDIGO 2FA (GOOGLE AUTHENTICATOR)
   ========================================================================== */
if ($action === 'login_step2' && $method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $code = trim((string) ($payload['code'] ?? ''));
    $remember = !empty($payload['remember']);

    // Verificar que el Paso 1 se haya completado en los últimos 300 segundos
    $step1Passed = !empty($_SESSION['auth_step1_passed']);
    $step1Time = (int) ($_SESSION['auth_step1_time'] ?? 0);
    if (!$step1Passed || (time() - $step1Time) > 300) {
        unset($_SESSION['auth_step1_passed'], $_SESSION['auth_step1_time']);
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'La sesión del primer paso expiró. Por favor ingresa tus credenciales nuevamente.'
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

/* ==========================================================================
   GET: INFORMACIÓN DE CONFIGURACIÓN 2FA (SÓLO SI ESTÁ AUTENTICADO)
   ========================================================================== */
if ($action === 'setup_2fa') {
    $canAccessSetup = admin_is_authenticated() || !empty($_SESSION['auth_step1_passed']);
    if (!$canAccessSetup) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No autorizado']);
        exit;
    }

    $otpauth = "otpauth://totp/SELOASA:{$adminEmail}?secret={$adminTotpSecret}&issuer=SELOASA&period=30&digits=6";
    echo json_encode([
        'success' => true,
        'email' => $adminEmail,
        'issuer' => 'SELOASA',
        'secret' => $adminTotpSecret,
        'otpauth_url' => $otpauth
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Acción no reconocida'], JSON_UNESCAPED_UNICODE);
