<?php

require_once __DIR__ . '/mail_helper.php';

const ADMIN_SESSION_NAME = 'SELOASA_admin_session';
const ADMIN_STORAGE_DIR = __DIR__ . '/storage';
const ADMIN_VACANCIES_FILE = ADMIN_STORAGE_DIR . '/vacancies.json';
const ADMIN_LOGIN_ATTEMPTS_FILE = ADMIN_STORAGE_DIR . '/admin_login_attempts.json';
const ADMIN_LOGIN_WINDOW_SECONDS = 600;
const ADMIN_LOGIN_BLOCK_SECONDS = 900;
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;

if (!function_exists('admin_env')) {
    function admin_env(string $key, ?string $default = null): ?string
    {
        return mail_env($key, $default);
    }
}

if (!function_exists('admin_is_secure_request')) {
    function admin_is_secure_request(): bool
    {
        return !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    }
}

if (!function_exists('admin_start_session')) {
    function admin_start_session(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_name(ADMIN_SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => admin_is_secure_request(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        session_start();
    }
}

if (!function_exists('admin_storage_ensure')) {
    function admin_storage_ensure(): void
    {
        if (!is_dir(ADMIN_STORAGE_DIR)) {
            @mkdir(ADMIN_STORAGE_DIR, 0775, true);
        }

        if (!is_file(ADMIN_VACANCIES_FILE)) {
            admin_write_json_file(ADMIN_VACANCIES_FILE, [
                'updated_at' => date('c'),
                'items' => admin_default_vacancies(),
            ]);
        }

        if (!is_file(ADMIN_LOGIN_ATTEMPTS_FILE)) {
            admin_write_json_file(ADMIN_LOGIN_ATTEMPTS_FILE, []);
        }
    }
}

if (!function_exists('admin_default_vacancies')) {
    function admin_default_vacancies(): array
    {
        $createdAt = date('c');

        return [
            [
                'id' => 'coordinador-monitoreo-logistico',
                'status' => 'published',
                'sort_order' => 10,
                'title' => 'Coordinador de Monitoreo Logistico',
                'area' => 'Monitoreo',
                'mode' => 'Presencial',
                'location' => 'Lerma, Estado de Mexico',
                'schedule' => 'Tiempo completo',
                'summary' => 'Responsable de dar seguimiento a la operacion diaria, visibilidad de unidades e incidencias durante el trayecto.',
                'points' => [
                    'Monitoreo de rutas, GPS y eventos criticos en tiempo real.',
                    'Comunicacion con operacion y clientes ante desviaciones o alertas.',
                    'Seguimiento de reportes, evidencias y control de indicadores operativos.',
                ],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ],
            [
                'id' => 'auxiliar-almacen-farmaceutico',
                'status' => 'published',
                'sort_order' => 20,
                'title' => 'Auxiliar de Almacen Farmaceutico',
                'area' => 'Almacen',
                'mode' => 'Presencial',
                'location' => 'Lerma, Estado de Mexico',
                'schedule' => 'Tiempo completo',
                'summary' => 'Perfil orientado al manejo seguro de producto, control documental y operacion diaria dentro de almacenes especializados.',
                'points' => [
                    'Recepcion, surtido y acomodo de producto conforme a proceso.',
                    'Control de lotes, caducidades y condiciones de temperatura.',
                    'Apoyo en inventarios, limpieza operativa y trazabilidad.',
                ],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ],
            [
                'id' => 'operador-transporte-refrigerado',
                'status' => 'published',
                'sort_order' => 30,
                'title' => 'Operador de Transporte Refrigerado',
                'area' => 'Transporte',
                'mode' => 'Operacion en ruta',
                'location' => 'Cobertura local y foranea',
                'schedule' => 'Tiempo completo',
                'summary' => 'Vacante enfocada en entregas con control de temperatura, cumplimiento documental y operacion segura de unidades.',
                'points' => [
                    'Traslado de producto sensible bajo lineamientos de cadena de frio.',
                    'Verificacion de unidad, evidencias de entrega y documentacion de ruta.',
                    'Cumplimiento de protocolos de seguridad y atencion al cliente en entrega.',
                ],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ],
        ];
    }
}

if (!function_exists('admin_read_json_file')) {
    function admin_read_json_file(string $path, $default)
    {
        if (!is_file($path)) {
            return $default;
        }

        $raw = @file_get_contents($path);
        if ($raw === false || trim($raw) === '') {
            return $default;
        }

        $decoded = json_decode($raw, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : $default;
    }
}

if (!function_exists('admin_write_json_file')) {
    function admin_write_json_file(string $path, $data): bool
    {
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            return false;
        }

        return @file_put_contents($path, $json . PHP_EOL, LOCK_EX) !== false;
    }
}

if (!function_exists('admin_get_vacancy_store')) {
    function admin_get_vacancy_store(): array
    {
        admin_storage_ensure();

        $default = [
            'updated_at' => date('c'),
            'items' => admin_default_vacancies(),
        ];

        $store = admin_read_json_file(ADMIN_VACANCIES_FILE, $default);

        if (!is_array($store)) {
            return $default;
        }

        $items = $store['items'] ?? [];
        if (!is_array($items)) {
            $items = [];
        }

        admin_sort_vacancy_items($items);

        return [
            'updated_at' => (string) ($store['updated_at'] ?? date('c')),
            'items' => array_values($items),
        ];
    }
}

if (!function_exists('admin_save_vacancy_store')) {
    function admin_save_vacancy_store(array $items): bool
    {
        admin_storage_ensure();
        admin_sort_vacancy_items($items);

        return admin_write_json_file(ADMIN_VACANCIES_FILE, [
            'updated_at' => date('c'),
            'items' => array_values($items),
        ]);
    }
}

if (!function_exists('admin_sort_vacancy_items')) {
    function admin_sort_vacancy_items(array &$items): void
    {
        usort($items, static function (array $left, array $right): int {
            $leftOrder = (int) ($left['sort_order'] ?? 999);
            $rightOrder = (int) ($right['sort_order'] ?? 999);

            if ($leftOrder !== $rightOrder) {
                return $leftOrder <=> $rightOrder;
            }

            return strcasecmp((string) ($left['title'] ?? ''), (string) ($right['title'] ?? ''));
        });
    }
}

if (!function_exists('admin_get_all_vacancies')) {
    function admin_get_all_vacancies(): array
    {
        $store = admin_get_vacancy_store();
        return $store['items'];
    }
}

if (!function_exists('admin_get_public_vacancies')) {
    function admin_get_public_vacancies(): array
    {
        return array_values(array_filter(admin_get_all_vacancies(), static function (array $vacancy): bool {
            return (string) ($vacancy['status'] ?? 'draft') === 'published';
        }));
    }
}

if (!function_exists('admin_find_vacancy_by_id')) {
    function admin_find_vacancy_by_id(string $id, bool $publicOnly = false): ?array
    {
        $items = $publicOnly ? admin_get_public_vacancies() : admin_get_all_vacancies();

        foreach ($items as $vacancy) {
            if ((string) ($vacancy['id'] ?? '') === $id) {
                return $vacancy;
            }
        }

        return null;
    }
}

if (!function_exists('admin_public_vacancy_map')) {
    function admin_public_vacancy_map(): array
    {
        $map = [];

        foreach (admin_get_public_vacancies() as $vacancy) {
            $id = (string) ($vacancy['id'] ?? '');
            $title = trim((string) ($vacancy['title'] ?? ''));

            if ($id !== '' && $title !== '') {
                $map[$id] = $title;
            }
        }

        return $map;
    }
}

if (!function_exists('admin_strlen')) {
    function admin_strlen(string $value): int
    {
        return function_exists('mb_strlen') ? (int) mb_strlen($value, 'UTF-8') : strlen($value);
    }
}

if (!function_exists('admin_substr')) {
    function admin_substr(string $value, int $start, int $length): string
    {
        if (function_exists('mb_substr')) {
            return (string) mb_substr($value, $start, $length, 'UTF-8');
        }

        return substr($value, $start, $length);
    }
}

if (!function_exists('admin_clean_text')) {
    function admin_clean_text(string $value, int $maxLength): string
    {
        $clean = strip_tags($value);
        $clean = preg_replace('/\s+/u', ' ', trim($clean));

        if ($clean === null) {
            $clean = '';
        }

        if (admin_strlen($clean) > $maxLength) {
            $clean = admin_substr($clean, 0, $maxLength);
        }

        return $clean;
    }
}

if (!function_exists('admin_clean_points')) {
    function admin_clean_points(string $value): array
    {
        $lines = preg_split('/\R/u', $value) ?: [];
        $points = [];

        foreach ($lines as $line) {
            $point = admin_clean_text((string) $line, 180);
            if ($point !== '') {
                $points[] = $point;
            }
        }

        return array_values(array_slice($points, 0, 8));
    }
}

if (!function_exists('admin_slugify')) {
    function admin_slugify(string $value): string
    {
        $value = trim($value);
        $transliterated = function_exists('iconv') ? @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) : $value;
        $slug = strtolower((string) ($transliterated !== false ? $transliterated : $value));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim((string) $slug, '-');

        return $slug !== '' ? $slug : 'vacante';
    }
}

if (!function_exists('admin_unique_vacancy_id')) {
    function admin_unique_vacancy_id(string $title, array $items, ?string $existingId = null): string
    {
        $base = admin_slugify($title);
        $candidate = $existingId !== null && $existingId !== '' ? $existingId : $base;
        $used = [];

        foreach ($items as $item) {
            $itemId = (string) ($item['id'] ?? '');
            if ($itemId !== '' && $itemId !== $existingId) {
                $used[$itemId] = true;
            }
        }

        if (!isset($used[$candidate])) {
            return $candidate;
        }

        $index = 2;
        while (isset($used[$base . '-' . $index])) {
            $index++;
        }

        return $base . '-' . $index;
    }
}

if (!function_exists('admin_vacancy_form_defaults')) {
    function admin_vacancy_form_defaults(): array
    {
        return [
            'existing_id' => '',
            'title' => '',
            'area' => '',
            'mode' => '',
            'location' => '',
            'schedule' => '',
            'summary' => '',
            'points_text' => '',
            'status' => 'published',
            'sort_order' => 100,
        ];
    }
}

if (!function_exists('admin_form_values_from_vacancy')) {
    function admin_form_values_from_vacancy(array $vacancy): array
    {
        return [
            'existing_id' => (string) ($vacancy['id'] ?? ''),
            'title' => (string) ($vacancy['title'] ?? ''),
            'area' => (string) ($vacancy['area'] ?? ''),
            'mode' => (string) ($vacancy['mode'] ?? ''),
            'location' => (string) ($vacancy['location'] ?? ''),
            'schedule' => (string) ($vacancy['schedule'] ?? ''),
            'summary' => (string) ($vacancy['summary'] ?? ''),
            'points_text' => implode(PHP_EOL, array_map('strval', $vacancy['points'] ?? [])),
            'status' => (string) ($vacancy['status'] ?? 'published'),
            'sort_order' => (int) ($vacancy['sort_order'] ?? 100),
        ];
    }
}

if (!function_exists('admin_upsert_vacancy')) {
    function admin_upsert_vacancy(array $input): array
    {
        $items = admin_get_all_vacancies();
        $existingId = trim((string) ($input['existing_id'] ?? ''));
        $existingVacancy = $existingId !== '' ? admin_find_vacancy_by_id($existingId) : null;

        $form = [
            'existing_id' => $existingId,
            'title' => admin_clean_text((string) ($input['title'] ?? ''), 120),
            'area' => admin_clean_text((string) ($input['area'] ?? ''), 60),
            'mode' => admin_clean_text((string) ($input['mode'] ?? ''), 60),
            'location' => admin_clean_text((string) ($input['location'] ?? ''), 120),
            'schedule' => admin_clean_text((string) ($input['schedule'] ?? ''), 120),
            'summary' => admin_clean_text((string) ($input['summary'] ?? ''), 420),
            'points_text' => trim((string) ($input['points_text'] ?? '')),
            'status' => (string) ($input['status'] ?? 'published') === 'draft' ? 'draft' : 'published',
            'sort_order' => filter_var($input['sort_order'] ?? 100, FILTER_VALIDATE_INT, [
                'options' => [
                    'default' => 100,
                    'min_range' => 0,
                    'max_range' => 9999,
                ],
            ]),
        ];

        $points = admin_clean_points($form['points_text']);
        $errors = [];

        if ($form['title'] === '' || admin_strlen($form['title']) < 5) {
            $errors['title'] = 'Ingresa un titulo claro para la vacante.';
        }

        if ($form['area'] === '' || admin_strlen($form['area']) < 3) {
            $errors['area'] = 'Ingresa el area de la vacante.';
        }

        if ($form['mode'] === '' || admin_strlen($form['mode']) < 3) {
            $errors['mode'] = 'Ingresa la modalidad o tipo de operacion.';
        }

        if ($form['location'] === '' || admin_strlen($form['location']) < 3) {
            $errors['location'] = 'Ingresa la ubicacion principal.';
        }

        if ($form['schedule'] === '' || admin_strlen($form['schedule']) < 3) {
            $errors['schedule'] = 'Ingresa el horario o tipo de jornada.';
        }

        if ($form['summary'] === '' || admin_strlen($form['summary']) < 20) {
            $errors['summary'] = 'Agrega un resumen mas descriptivo para la vacante.';
        }

        if (count($points) < 2) {
            $errors['points_text'] = 'Agrega al menos dos responsabilidades o puntos clave.';
        }

        if ($existingId !== '' && $existingVacancy === null) {
            $errors['general'] = 'No encontramos la vacante que intentas editar.';
        }

        if (!empty($errors)) {
            return [
                'success' => false,
                'errors' => $errors,
                'form' => $form,
            ];
        }

        $vacancyId = admin_unique_vacancy_id($form['title'], $items, $existingVacancy['id'] ?? null);
        $now = date('c');

        $vacancy = [
            'id' => $vacancyId,
            'status' => $form['status'],
            'sort_order' => (int) $form['sort_order'],
            'title' => $form['title'],
            'area' => $form['area'],
            'mode' => $form['mode'],
            'location' => $form['location'],
            'schedule' => $form['schedule'],
            'summary' => $form['summary'],
            'points' => $points,
            'created_at' => (string) ($existingVacancy['created_at'] ?? $now),
            'updated_at' => $now,
        ];

        $updated = false;

        foreach ($items as $index => $item) {
            if ((string) ($item['id'] ?? '') === $existingId) {
                $items[$index] = $vacancy;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            $items[] = $vacancy;
        }

        if (!admin_save_vacancy_store($items)) {
            return [
                'success' => false,
                'errors' => [
                    'general' => 'No fue posible guardar la vacante. Revisa permisos de escritura en php/storage.',
                ],
                'form' => $form,
            ];
        }

        return [
            'success' => true,
            'created' => !$updated,
            'vacancy' => $vacancy,
            'form' => admin_form_values_from_vacancy($vacancy),
        ];
    }
}

if (!function_exists('admin_delete_vacancy')) {
    function admin_delete_vacancy(string $id): bool
    {
        $id = trim($id);
        if ($id === '') {
            return false;
        }

        $items = admin_get_all_vacancies();
        $remaining = array_values(array_filter($items, static function (array $item) use ($id): bool {
            return (string) ($item['id'] ?? '') !== $id;
        }));

        if (count($remaining) === count($items)) {
            return false;
        }

        return admin_save_vacancy_store($remaining);
    }
}

if (!function_exists('admin_csrf_token')) {
    function admin_csrf_token(): string
    {
        admin_start_session();

        if (empty($_SESSION['admin_csrf_token'])) {
            $_SESSION['admin_csrf_token'] = bin2hex(random_bytes(32));
        }

        return (string) $_SESSION['admin_csrf_token'];
    }
}

if (!function_exists('admin_validate_csrf_token')) {
    function admin_validate_csrf_token(?string $token): bool
    {
        admin_start_session();
        $sessionToken = (string) ($_SESSION['admin_csrf_token'] ?? '');
        return $sessionToken !== '' && is_string($token) && hash_equals($sessionToken, $token);
    }
}

if (!function_exists('admin_flash')) {
    function admin_flash(string $type, string $message): void
    {
        admin_start_session();
        $_SESSION['admin_flash'] = [
            'type' => $type,
            'message' => $message,
        ];
    }
}

if (!function_exists('admin_pull_flash')) {
    function admin_pull_flash(): ?array
    {
        admin_start_session();

        if (empty($_SESSION['admin_flash']) || !is_array($_SESSION['admin_flash'])) {
            return null;
        }

        $flash = $_SESSION['admin_flash'];
        unset($_SESSION['admin_flash']);

        return $flash;
    }
}

if (!function_exists('admin_client_ip')) {
    function admin_client_ip(): string
    {
        $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($forwarded !== '') {
            $parts = explode(',', $forwarded);
            $candidate = trim((string) ($parts[0] ?? ''));
            if ($candidate !== '') {
                return $candidate;
            }
        }

        return trim((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    }
}

if (!function_exists('admin_login_attempts')) {
    function admin_login_attempts(): array
    {
        admin_storage_ensure();
        $attempts = admin_read_json_file(ADMIN_LOGIN_ATTEMPTS_FILE, []);
        return is_array($attempts) ? $attempts : [];
    }
}

if (!function_exists('admin_save_login_attempts')) {
    function admin_save_login_attempts(array $attempts): void
    {
        admin_write_json_file(ADMIN_LOGIN_ATTEMPTS_FILE, $attempts);
    }
}

if (!function_exists('admin_login_attempt_status')) {
    function admin_login_attempt_status(): array
    {
        $attempts = admin_login_attempts();
        $key = hash('sha256', admin_client_ip());
        $now = time();
        $changed = false;

        foreach ($attempts as $attemptKey => $entry) {
            $blockedUntil = (int) ($entry['blocked_until'] ?? 0);
            $lastAttempt = (int) ($entry['last_attempt'] ?? 0);

            if (($blockedUntil > 0 && $blockedUntil < $now) || ($blockedUntil === 0 && $lastAttempt > 0 && ($now - $lastAttempt) > ADMIN_LOGIN_WINDOW_SECONDS)) {
                unset($attempts[$attemptKey]);
                $changed = true;
            }
        }

        if ($changed) {
            admin_save_login_attempts($attempts);
        }

        $entry = $attempts[$key] ?? null;
        $blockedUntil = (int) ($entry['blocked_until'] ?? 0);

        return [
            'blocked' => $blockedUntil > $now,
            'seconds' => $blockedUntil > $now ? ($blockedUntil - $now) : 0,
        ];
    }
}

if (!function_exists('admin_register_login_failure')) {
    function admin_register_login_failure(): void
    {
        $attempts = admin_login_attempts();
        $key = hash('sha256', admin_client_ip());
        $now = time();
        $entry = $attempts[$key] ?? [
            'count' => 0,
            'first_attempt' => $now,
            'last_attempt' => $now,
            'blocked_until' => 0,
        ];

        $firstAttempt = (int) ($entry['first_attempt'] ?? $now);
        if (($now - $firstAttempt) > ADMIN_LOGIN_WINDOW_SECONDS) {
            $entry['count'] = 0;
            $entry['first_attempt'] = $now;
        }

        $entry['count'] = (int) ($entry['count'] ?? 0) + 1;
        $entry['last_attempt'] = $now;

        if ($entry['count'] >= ADMIN_LOGIN_MAX_ATTEMPTS) {
            $entry['blocked_until'] = $now + ADMIN_LOGIN_BLOCK_SECONDS;
            $entry['count'] = 0;
            $entry['first_attempt'] = $now;
        }

        $attempts[$key] = $entry;
        admin_save_login_attempts($attempts);
    }
}

if (!function_exists('admin_clear_login_failures')) {
    function admin_clear_login_failures(): void
    {
        $attempts = admin_login_attempts();
        $key = hash('sha256', admin_client_ip());

        if (isset($attempts[$key])) {
            unset($attempts[$key]);
            admin_save_login_attempts($attempts);
        }
    }
}

if (!function_exists('admin_totp_secret')) {
    function admin_totp_secret(): string
    {
        return strtoupper(preg_replace('/[^A-Z2-7]/', '', (string) admin_env('ADMIN_TOTP_SECRET', '')));
    }
}

if (!function_exists('admin_access_token')) {
    function admin_access_token(): string
    {
        return (string) admin_env('ADMIN_ACCESS_TOKEN', '');
    }
}

if (!function_exists('admin_base32_decode')) {
    function admin_base32_decode(string $secret): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret));

        if ($secret === '') {
            return '';
        }

        $binary = '';
        $buffer = 0;
        $bitsLeft = 0;

        for ($index = 0, $length = strlen($secret); $index < $length; $index++) {
            $position = strpos($alphabet, $secret[$index]);
            if ($position === false) {
                return '';
            }

            $buffer = ($buffer << 5) | $position;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $binary .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }

        return $binary;
    }
}

if (!function_exists('admin_generate_totp')) {
    function admin_generate_totp(string $secret, ?int $timestamp = null): string
    {
        $timestamp = $timestamp ?? time();
        $counter = (int) floor($timestamp / 30);
        $secretKey = admin_base32_decode($secret);

        if ($secretKey === '') {
            return '';
        }

        $binaryCounter = pack('N2', 0, $counter);
        $hash = hash_hmac('sha1', $binaryCounter, $secretKey, true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $value = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        ) % 1000000;

        return str_pad((string) $value, 6, '0', STR_PAD_LEFT);
    }
}

if (!function_exists('admin_verify_totp')) {
    function admin_verify_totp(string $secret, string $code, int $window = 1): bool
    {
        $normalizedCode = preg_replace('/\D+/', '', $code);
        if ($normalizedCode === null || strlen($normalizedCode) !== 6) {
            return false;
        }

        $time = time();

        for ($offset = -$window; $offset <= $window; $offset++) {
            $expected = admin_generate_totp($secret, $time + ($offset * 30));
            if ($expected !== '' && hash_equals($expected, $normalizedCode)) {
                return true;
            }
        }

        return false;
    }
}

if (!function_exists('admin_is_configured')) {
    function admin_is_configured(): bool
    {
        return admin_access_token() !== '' && admin_totp_secret() !== '' && admin_base32_decode(admin_totp_secret()) !== '';
    }
}

if (!function_exists('admin_session_fingerprint')) {
    function admin_session_fingerprint(): string
    {
        return hash('sha256', (string) ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));
    }
}

if (!function_exists('admin_is_authenticated')) {
    function admin_is_authenticated(): bool
    {
        admin_start_session();

        $authenticated = !empty($_SESSION['admin_authenticated']);
        $fingerprint = (string) ($_SESSION['admin_fingerprint'] ?? '');

        return $authenticated && $fingerprint !== '' && hash_equals($fingerprint, admin_session_fingerprint());
    }
}

if (!function_exists('admin_login')) {
    function admin_login(string $accessToken, string $totpCode): array
    {
        admin_start_session();

        if (!admin_is_configured()) {
            return [
                'success' => false,
                'message' => 'Configura ADMIN_ACCESS_TOKEN y ADMIN_TOTP_SECRET antes de usar el admin.',
            ];
        }

        $status = admin_login_attempt_status();
        if (!empty($status['blocked'])) {
            return [
                'success' => false,
                'message' => 'Demasiados intentos fallidos. Espera ' . (int) $status['seconds'] . ' segundos para intentar de nuevo.',
            ];
        }

        $isTokenValid = hash_equals(admin_access_token(), trim($accessToken));
        $isTotpValid = admin_verify_totp(admin_totp_secret(), $totpCode);

        if (!$isTokenValid || !$isTotpValid) {
            admin_register_login_failure();
            return [
                'success' => false,
                'message' => 'El token o el codigo de verificacion no son validos.',
            ];
        }

        admin_clear_login_failures();
        session_regenerate_id(true);
        $_SESSION['admin_authenticated'] = true;
        $_SESSION['admin_fingerprint'] = admin_session_fingerprint();
        $_SESSION['admin_authenticated_at'] = date('c');

        return [
            'success' => true,
            'message' => 'Autenticacion correcta.',
        ];
    }
}

if (!function_exists('admin_logout')) {
    function admin_logout(): void
    {
        admin_start_session();
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool) ($params['secure'] ?? false), (bool) ($params['httponly'] ?? true));
        }

        session_destroy();
    }
}

if (!function_exists('admin_require_auth')) {
    function admin_require_auth(): void
    {
        if (admin_is_authenticated()) {
            return;
        }

        header('Location: ../admin/');
        exit;
    }
}

if (!function_exists('admin_html')) {
    function admin_html(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('admin_status_badge_class')) {
    function admin_status_badge_class(string $status): string
    {
        return $status === 'published' ? 'admin-badge admin-badge-published' : 'admin-badge admin-badge-draft';
    }
}

if (!function_exists('admin_status_label')) {
    function admin_status_label(string $status): string
    {
        return $status === 'published' ? 'Publicada' : 'Borrador';
    }
}

if (!function_exists('admin_format_datetime')) {
    function admin_format_datetime(?string $value): string
    {
        if ($value === null || trim($value) === '') {
            return 'Sin fecha';
        }

        $timestamp = strtotime($value);
        if ($timestamp === false) {
            return 'Sin fecha';
        }

        return date('d/m/Y H:i', $timestamp);
    }
}

if (!function_exists('admin_dashboard_stats')) {
    function admin_dashboard_stats(): array
    {
        $items = admin_get_all_vacancies();
        $published = 0;
        $drafts = 0;
        $lastUpdated = '';

        foreach ($items as $item) {
            if ((string) ($item['status'] ?? 'draft') === 'published') {
                $published++;
            } else {
                $drafts++;
            }

            $updatedAt = (string) ($item['updated_at'] ?? '');
            if ($updatedAt !== '' && ($lastUpdated === '' || strtotime($updatedAt) > strtotime($lastUpdated))) {
                $lastUpdated = $updatedAt;
            }
        }

        return [
            'total' => count($items),
            'published' => $published,
            'drafts' => $drafts,
            'last_updated' => $lastUpdated,
        ];
    }
}
