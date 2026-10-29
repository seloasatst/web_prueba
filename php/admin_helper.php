<?php

$vendorAutoload = dirname(__DIR__) . '/vendor/autoload.php';
if (file_exists($vendorAutoload)) {
    require_once $vendorAutoload;
}

require_once __DIR__ . '/mail_helper.php';

const ADMIN_SESSION_NAME = 'SELOASA_admin_session';
const ADMIN_STORAGE_DIR = __DIR__ . '/storage';
const ADMIN_VACANCIES_FILE = ADMIN_STORAGE_DIR . '/vacancies.json';
const ADMIN_NOTICIAS_FILE = ADMIN_STORAGE_DIR . '/noticias.json';
const ADMIN_POPUPS_FILE = ADMIN_STORAGE_DIR . '/popups.json';
const ADMIN_TESTIMONIOS_FILE = ADMIN_STORAGE_DIR . '/testimonios.json';
const ADMIN_POSTULACIONES_FILE = ADMIN_STORAGE_DIR . '/postulaciones.json';
const ADMIN_ALLOWED_EMAILS_FILE = ADMIN_STORAGE_DIR . '/admin_allowed_emails.json';
const ADMIN_LOGIN_ATTEMPTS_FILE = ADMIN_STORAGE_DIR . '/admin_login_attempts.json';
const ADMIN_LOGIN_WINDOW_SECONDS = 600;
const ADMIN_LOGIN_BLOCK_SECONDS = 900;
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
const ADMIN_EMAIL_OTP_LIFETIME = 600; // Vigencia estricta de 10 minutos (600 segundos)

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

        if (!headers_sent()) {
            session_name(ADMIN_SESSION_NAME);
            session_set_cookie_params([
                'lifetime' => 0,
                'path' => '/',
                'secure' => admin_is_secure_request(),
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
        }

        @session_start();
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

        if (!is_file(ADMIN_NOTICIAS_FILE)) {
            admin_write_json_file(ADMIN_NOTICIAS_FILE, [
                'updated_at' => date('c'),
                'items' => admin_default_posts(),
            ]);
        }

        if (!is_file(ADMIN_POPUPS_FILE)) {
            admin_write_json_file(ADMIN_POPUPS_FILE, [
                'updated_at' => date('c'),
                'items' => admin_default_popups(),
            ]);
        }

        if (!is_file(ADMIN_TESTIMONIOS_FILE)) {
            admin_write_json_file(ADMIN_TESTIMONIOS_FILE, [
                'updated_at' => date('c'),
                'items' => admin_default_testimonios(),
            ]);
        }

        if (!is_file(ADMIN_POSTULACIONES_FILE)) {
            admin_write_json_file(ADMIN_POSTULACIONES_FILE, [
                'updated_at' => date('c'),
                'items' => [],
            ]);
        }

        if (!is_file(ADMIN_ALLOWED_EMAILS_FILE)) {
            admin_write_json_file(ADMIN_ALLOWED_EMAILS_FILE, [
                'updated_at' => date('c'),
                'emails' => admin_default_allowed_emails(),
            ]);
        }

        if (!is_file(ADMIN_LOGIN_ATTEMPTS_FILE)) {
            admin_write_json_file(ADMIN_LOGIN_ATTEMPTS_FILE, []);
        }
    }
}

if (!function_exists('admin_default_allowed_emails')) {
    function admin_default_allowed_emails(): array
    {
        return [
            'admin@seloasa.com.mx',
            'gadiel.palma@seloasa.com.mx',
            'rh@seloasa.com.mx',
            'almacen@seloasa.com.mx',
            'direccion@seloasa.com.mx',
            'yasser.hernandez@seloasa.com.mx',
            'ti@seloasa.com.mx'
        ];
    }
}

if (!function_exists('admin_get_allowed_emails')) {
    function admin_get_allowed_emails(): array
    {
        admin_storage_ensure();
        $default = [
            'updated_at' => date('c'),
            'emails' => admin_default_allowed_emails(),
        ];
        $store = admin_read_json_file(ADMIN_ALLOWED_EMAILS_FILE, $default);
        $emails = is_array($store['emails'] ?? null) ? $store['emails'] : admin_default_allowed_emails();

        // Verificar si hay correos adicionales definidos en .env
        $envEmails = admin_env('ADMIN_ALLOWED_EMAILS', '');
        if ($envEmails !== '') {
            foreach (preg_split('/[\s,;]+/', $envEmails) as $e) {
                $e = strtolower(trim($e));
                if ($e !== '' && !in_array($e, $emails, true)) {
                    $emails[] = $e;
                }
            }
        }

        return array_values(array_unique(array_map('strtolower', array_map('trim', $emails))));
    }
}

if (!function_exists('admin_is_email_allowed')) {
    function admin_is_email_allowed(string $email): bool
    {
        $normalized = strtolower(trim($email));
        if ($normalized === '' || !filter_var($normalized, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        $allowed = admin_get_allowed_emails();
        return in_array($normalized, $allowed, true);
    }
}

if (!function_exists('admin_generate_email_otp')) {
    function admin_generate_email_otp(string $email): array
    {
        admin_start_session();
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = time() + ADMIN_EMAIL_OTP_LIFETIME;

        $_SESSION['auth_email_otp'] = $code;
        $_SESSION['auth_email_otp_expires'] = $expiresAt;
        $_SESSION['auth_email_otp_target'] = strtolower(trim($email));
        $_SESSION['auth_email_otp_created'] = time();

        @file_put_contents(ADMIN_STORAGE_DIR . '/admin_last_otp.json', json_encode([
            'email' => strtolower(trim($email)),
            'code' => $code,
            'expires_at' => $expiresAt,
            'expires_in' => ADMIN_EMAIL_OTP_LIFETIME,
            'created_at' => date('c'),
        ], JSON_PRETTY_PRINT));

        return [
            'code' => $code,
            'expires_at' => $expiresAt,
            'expires_in' => ADMIN_EMAIL_OTP_LIFETIME,
        ];
    }
}

if (!function_exists('admin_verify_email_otp')) {
    function admin_verify_email_otp(string $email, string $code): array
    {
        admin_start_session();
        $normalizedEmail = strtolower(trim($email));
        $normalizedCode = preg_replace('/\D/', '', trim($code));

        $sessionCode = (string) ($_SESSION['auth_email_otp'] ?? '');
        $expiresAt = (int) ($_SESSION['auth_email_otp_expires'] ?? 0);
        $targetEmail = (string) ($_SESSION['auth_email_otp_target'] ?? '');

        // Fallback a almacenamiento seguro en disco si la sesión PHP se perdió o no viajó la cookie
        if ($sessionCode === '' || $targetEmail === '' || $expiresAt === 0) {
            $otpFile = ADMIN_STORAGE_DIR . '/admin_last_otp.json';
            if (is_file($otpFile)) {
                $fileData = json_decode((string) file_get_contents($otpFile), true);
                if (is_array($fileData)) {
                    $sessionCode = (string) ($fileData['code'] ?? '');
                    $expiresAt = (int) ($fileData['expires_at'] ?? 0);
                    $targetEmail = (string) ($fileData['email'] ?? '');
                }
            }
        }

        if ($sessionCode === '' || $targetEmail === '' || $expiresAt === 0) {
            return [
                'valid' => false,
                'error' => 'No hay ningún código activo pendiente. Solicita uno nuevo introduciendo tu correo.'
            ];
        }

        // Si se proporcionó email, validar coincidencia (si viene vacío, usar el email registrado del código)
        if ($normalizedEmail !== '' && strcasecmp($normalizedEmail, $targetEmail) !== 0) {
            return [
                'valid' => false,
                'error' => 'El correo no coincide con el destinatario del código emitido.'
            ];
        }

        if (time() > $expiresAt) {
            unset($_SESSION['auth_email_otp'], $_SESSION['auth_email_otp_expires']);
            @unlink(ADMIN_STORAGE_DIR . '/admin_last_otp.json');
            return [
                'valid' => false,
                'expired' => true,
                'error' => 'El código ha expirado (vigencia estricta de 10 minutos). Solicita un nuevo código.'
            ];
        }

        if (!hash_equals($sessionCode, $normalizedCode)) {
            return [
                'valid' => false,
                'error' => 'Código de 6 dígitos incorrecto. Revisa el correo recibido.'
            ];
        }

        // OTP válido: limpiar código de un solo uso
        unset($_SESSION['auth_email_otp'], $_SESSION['auth_email_otp_expires']);
        @unlink(ADMIN_STORAGE_DIR . '/admin_last_otp.json');

        // Registrar paso 1 superado (correo verificado) en sesión y almacenamiento
        $_SESSION['auth_step1_passed'] = true;
        $_SESSION['auth_step1_time'] = time();
        $_SESSION['auth_step1_email'] = $targetEmail;

        @file_put_contents(ADMIN_STORAGE_DIR . '/admin_step1_passed.json', json_encode([
            'passed' => true,
            'time' => time(),
            'email' => $targetEmail
        ], JSON_PRETTY_PRINT));

        return [
            'valid' => true,
            'email' => $targetEmail
        ];
    }
}

if (!function_exists('admin_send_otp_email')) {
    function admin_send_otp_email(string $email, string $code, int $expiresInSeconds = 600): array
    {
        $minutes = (int) round($expiresInSeconds / 60);
        $expiryTimeStr = date('H:i:s', time() + $expiresInSeconds);

        $subject = "SELOASA - Tu código de acceso administrativo: {$code}";

        $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>{$subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6f7;font-family:Arial,Helvetica,sans-serif;color:#1f252b;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f6f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:580px;background:#ffffff;border-radius:24px;border:1px solid #ececec;box-shadow:0 18px 45px rgba(31,37,43,0.08);overflow:hidden;">
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,#e43b14 0%,#bf2f0f 100%);"></td>
          </tr>
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;">
              <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#e43b14;margin-bottom:8px;">Control de Seguridad &bull; SELOASA</div>
              <h2 style="margin:0 0 12px;color:#1f252b;font-size:24px;font-weight:800;">Código de Verificación</h2>
              <p style="margin:0 0 24px;color:#5b6167;font-size:15px;line-height:1.5;">Has solicitado acceder al panel administrativo de SELOASA. Ingresa este código numérico en la pantalla de acceso para continuar con el segundo factor (Google Authenticator).</p>
              
              <!-- Recuadro del Código OTP -->
              <div style="background:#fcf1ee;border:2px dashed #e43b14;border-radius:16px;padding:20px;margin:0 auto 24px;max-width:320px;">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#bf2f0f;margin-bottom:6px;">Clave Temporal de Acceso</div>
                <div style="font-size:38px;font-weight:900;letter-spacing:8px;color:#e43b14;font-family:Consolas,monospace;">{$code}</div>
                <div style="margin-top:8px;font-size:12px;color:#7a8086;">Válida durante <strong>{$minutes} minutos</strong> (hasta las {$expiryTimeStr})</div>
              </div>

              <div style="background:#f7f7f7;border-radius:12px;padding:14px 18px;text-align:left;font-size:13px;color:#555;line-height:1.5;">
                <strong><span style="color:#e43b14;">&#9888;</span> Importante:</strong>
                <ul style="margin:6px 0 0;padding-left:18px;">
                  <li>Este código es de un solo uso y expirará automáticamente en {$minutes} minutos.</li>
                  <li>Tras ingresarlo, el sistema te solicitará tu código de <strong>Google Authenticator</strong>.</li>
                  <li>Si no solicitaste este código, notifica de inmediato al equipo de TI.</li>
                </ul>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#fafafa;border-top:1px solid #f0f0f0;text-align:center;font-size:12px;color:#999;">
              Servicios Logísticos Alsera S.A. de C.V. &bull; Lerma, Estado de México
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

        $mailSent = false;
        $errorMsg = '';

        if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
            try {
                $mail = new PHPMailer\PHPMailer\PHPMailer(true);
                configure_site_mailer($mail, 'Seguridad SELOASA');
                $mailTimeout = (int) admin_env('SMTP_TIMEOUT', '10');
                $mail->Timeout = $mailTimeout > 0 ? $mailTimeout : 10;
                $mail->addAddress($email);
                $mail->isHTML(true);
                $mail->Subject = $subject;
                $mail->Body = $htmlBody;
                $mail->AltBody = "SELOASA - Código de Acceso Administrativo\n\nTu código es: {$code}\nVálido durante {$minutes} minutos (hasta las {$expiryTimeStr}).\n\nSi no lo solicitaste, ignora este mensaje.";
                $mail->send();
                $mailSent = true;
            } catch (Throwable $e) {
                $errorMsg = $e->getMessage();
                error_log("Error enviando OTP email a {$email}: " . $errorMsg);
            }
        }

        if (!$mailSent) {
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "From: Seguridad SELOASA <no-reply@seloasa.com.mx>\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion();
            $mailSent = @mail($email, $subject, $htmlBody, $headers);
        }

        return [
            'sent' => $mailSent,
            'error' => $errorMsg
        ];
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
                'recipient_emails' => 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx',
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
                'recipient_emails' => 'gadiel.palma@SELOASA.com.mx, almacen@seloasa.com.mx',
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
                'recipient_emails' => 'gadiel.palma@SELOASA.com.mx, operaciones@seloasa.com.mx',
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

        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        $tmpFile = @tempnam($dir, 'seloasa_tmp_');
        if ($tmpFile !== false) {
            $written = @file_put_contents($tmpFile, $json . PHP_EOL, LOCK_EX);
            if ($written !== false) {
                if (@rename($tmpFile, $path)) {
                    @chmod($path, 0664);
                    return true;
                }
                @copy($tmpFile, $path);
                @unlink($tmpFile);
                @chmod($path, 0664);
                return true;
            }
            @unlink($tmpFile);
        }

        return @file_put_contents($path, $json . PHP_EOL, LOCK_EX) !== false;
    }
}

if (!function_exists('admin_default_posts')) {
    function admin_default_posts(): array
    {
        $now = date('c');
        return [
            [
                'id' => 'comunicado-gdp-2026',
                'type' => 'comunicado',
                'category' => 'Comunicado Oficial',
                'badge_class' => 'badge-pill-comunicado',
                'status' => 'published',
                'is_featured' => true,
                'title' => 'Comunicado Oficial: Certificación en Buenas Prácticas de Distribución (GDP) y Renovación de Protocolos 2026',
                'summary' => 'SELOASA ratifica su liderazgo en el transporte farmacéutico nacional al renovar su sistema de aseguramiento de calidad térmica conforme a los más estrictos estándares regulatorios internacionales y de COFEPRIS.',
                'content' => '<p>Como parte de nuestro compromiso permanente con la salud pública y la integridad de los tratamientos médicos en México, SELOASA informa a sus clientes, socios comerciales y autoridades sanitarias sobre la exitosa culminación del proceso de recertificación y actualización de sus <strong>Buenas Prácticas de Distribución (GDP)</strong> para el ciclo operativo 2026.</p><h4>1. Actualización Integral de la Cadena de Frío</h4><p>Nuestra flota e instalaciones en el Centro Logístico Lerma han sido auditadas bajo esquemas de monitoreo continuo con sensores calibrados trazables ante el Centro Nacional de Metrología (CENAM), garantizando precisión térmica en los tres rangos críticos: <em>ultracongelación (-20°C a -10°C), refrigeración controlada (2°C a 8°C) y temperatura ambiente regulada (15°C a 25°C)</em>.</p><div class="visual-callout"><strong>Resolución Ejecutiva:</strong> Todos los embarques cuentan con póliza de respaldo de trazabilidad térmica digital e informe inmediato disponible para auditorías sanitarias y de clientes corporativos.</div>',
                'date' => 'Mayo 2026',
                'dept' => 'Dirección General & Aseguramiento de Calidad',
                'read_time' => '3 min',
                'image' => 'img/patio_unidades_dia_banner.jpg',
                'pdf_enabled' => true,
                'pdf_title' => 'Circular Oficial GDP 2026 (PDF)',
                'pdf_url' => 'docs_pdf/protocolo_seguridad.pdf',
                'pdf_btn_text' => 'Descargar Circular Oficial en PDF',
                'pdf_desc' => 'Documento oficial membretado con especificaciones técnicas, sellos de calidad y dictamen de calibración para auditorías.',
                'normativa_enabled' => true,
                'normativa_title' => 'Marco Normativo Aplicable',
                'normativa_items' => "NOM-059-SSA1-2015: Buenas prácticas de distribución.\nNOM-072-SSA1-2012: Etiquetado de insumos.\nDirectrices GDP / OMS: Monitoreo continuo.",
                'translations' => [
                    'es' => [
                        'title' => 'Comunicado Oficial: Certificación en Buenas Prácticas de Distribución (GDP) y Renovación de Protocolos 2026',
                        'summary' => 'SELOASA ratifica su liderazgo en el transporte farmacéutico nacional al renovar su sistema de aseguramiento de calidad térmica conforme a los más estrictos estándares regulatorios internacionales y de COFEPRIS.',
                        'category' => 'Comunicado Oficial',
                        'dept' => 'Dirección General & Aseguramiento de Calidad'
                    ]
                ],
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'noticia-nueva-flota-2026',
                'type' => 'noticia',
                'category' => 'Noticia Operativa',
                'badge_class' => 'badge-pill-noticia',
                'status' => 'published',
                'is_featured' => false,
                'title' => 'Ampliación de Flota: Incorporación de Unidades Refrigeradas de Última Generación',
                'summary' => 'SELOASA fortalece su infraestructura operativa con nuevas unidades equipadas con sistemas multitemperatura y telemetría de monitoreo térmico en tiempo real.',
                'content' => '<p>Con el objetivo de incrementar nuestra capacidad de respuesta y garantizar el abasto ininterrumpido a centros de distribución y hospitales en toda la República Mexicana, SELOASA completó la incorporación de nuevas unidades de transporte con tecnología de vanguardia.</p><h4>Monitoreo Térmico con Redundancia</h4><p>Cada vehículo cuenta con caja isotérmica de alto rendimiento, compresores ecológicos certificados y doble canal de transmisión GPS/GPRS para supervisión remota 24/7/365.</p>',
                'date' => 'Abril 2026',
                'dept' => 'Gerencia de Operaciones y Flota',
                'read_time' => '2 min',
                'image' => 'img/feature.jpg',
                'pdf_enabled' => false,
                'pdf_title' => '',
                'pdf_url' => '',
                'pdf_btn_text' => '',
                'pdf_desc' => '',
                'normativa_enabled' => true,
                'normativa_title' => 'Especificaciones de Flota',
                'normativa_items' => "Sistemas Thermo King multitemperatura.\nTelemetría GPS y 4G con tolerancia ±0.5°C.\nMonitoreo centralizado 24/7 desde Torre de Control Lerma.",
                'translations' => [
                    'es' => [
                        'title' => 'Ampliación de Flota: Incorporación de Unidades Refrigeradas de Última Generación',
                        'summary' => 'SELOASA fortalece su infraestructura operativa con nuevas unidades equipadas con sistemas multitemperatura y telemetría de monitoreo térmico en tiempo real.',
                        'category' => 'Noticia Operativa',
                        'dept' => 'Gerencia de Operaciones y Flota'
                    ]
                ],
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'monitoreo-cadena-frio',
                'type' => 'blog',
                'category' => 'Blog Farma',
                'badge_class' => 'badge-pill-blog',
                'status' => 'published',
                'is_featured' => false,
                'title' => 'Gestión de Riesgos y Trazabilidad Térmica en el Transporte Farmacéutico',
                'summary' => 'Análisis técnico sobre la prevención de excursiones de temperatura, validación de rutas y protocolos de contingencia en logística sanitaria.',
                'content' => '<p>El transporte de medicamentos y productos biológicos representa uno de los eslabones más delicados de la cadena de suministro en salud. Una variación térmica no detectada puede comprometer la eficacia terapéutica de un tratamiento biológico o vacuna.</p><h4>Pilares de la Trazabilidad Continua</h4><p>En este artículo examinamos las mejores prácticas para el mapeo térmico de cajas de carga, protocolos de contingencia ante eventos carreteros y la integración de reportes analíticos para auditorías sanitarias.</p>',
                'date' => 'Marzo 2026',
                'dept' => 'Comité Técnico de Calidad Farmacéutica',
                'read_time' => '4 min',
                'image' => 'img/about.jpg',
                'pdf_enabled' => false,
                'pdf_title' => '',
                'pdf_url' => '',
                'pdf_btn_text' => '',
                'pdf_desc' => '',
                'normativa_enabled' => false,
                'normativa_title' => '',
                'normativa_items' => '',
                'translations' => [
                    'es' => [
                        'title' => 'Gestión de Riesgos y Trazabilidad Térmica en el Transporte Farmacéutico',
                        'summary' => 'Análisis técnico sobre la prevención de excursiones de temperatura, validación de rutas y protocolos de contingencia en logística sanitaria.',
                        'category' => 'Blog Farma',
                        'dept' => 'Comité Técnico de Calidad Farmacéutica'
                    ]
                ],
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];
    }
}

if (!function_exists('admin_default_popups')) {
    function admin_default_popups(): array
    {
        $now = date('c');
        return [
            [
                'id' => 'popup-cofepris-2026',
                'title' => 'Aviso Oficial de Operación Farmacéutica 2026',
                'subtitle' => 'Certificación y Cumplimiento Normativo',
                'type' => 'alerta',
                'layout' => 'top',
                'message' => '<p>SELOASA ratifica su compromiso con el estricto cumplimiento de las Buenas Prácticas de Distribución de Insumos para la Salud (NOM-059-SSA1 y NOM-072-SSA1), operando con protocolos de cadena de frío y trazabilidad térmica permanente en cada ruta.</p>',
                'image' => 'img/about.jpg',
                'btn_primary_text' => 'Conocer Protocolos de Calidad',
                'btn_primary_url' => 'services/',
                'btn_secondary_text' => 'Entendido',
                'custom_footer' => 'Circular Normativa COFEPRIS & GDP',
                'active' => true,
                'frequency' => 'session',
                'delay' => 1.5,
                'translations' => [
                    'es' => [
                        'title' => 'Aviso Oficial de Operación Farmacéutica 2026',
                        'subtitle' => 'Certificación y Cumplimiento Normativo',
                        'message' => '<p>SELOASA ratifica su compromiso con el estricto cumplimiento de las Buenas Prácticas de Distribución de Insumos para la Salud (NOM-059-SSA1 y NOM-072-SSA1), operando con protocolos de cadena de frío y trazabilidad térmica permanente en cada ruta.</p>',
                        'btn_primary_text' => 'Conocer Protocolos de Calidad',
                        'btn_secondary_text' => 'Entendido',
                        'custom_footer' => 'Circular Normativa COFEPRIS & GDP'
                    ]
                ],
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ];
    }
}

if (!function_exists('admin_default_testimonios')) {
    function admin_default_testimonios(): array
    {
        $now = date('c');
        return [
            [
                'id' => 'ralca',
                'company' => 'RALCA S.A. De C.V.',
                'logo' => 'img/logos/RALCA.png',
                'role' => 'Departamento de Calidad',
                'text' => 'Trabajar con SELOASA nos da mucha tranquilidad. Se nota su compromiso y la atención al detalle en cada entrega.',
                'status' => 'published',
                'order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'roche',
                'company' => 'ROCHE',
                'logo' => 'img/logos/roche.png',
                'role' => 'Departamento de Logística',
                'text' => 'Más que un proveedor, SELOASA es un verdadero aliado estratégico para resguardar nuestros envíos bajo cadena de frío.',
                'status' => 'published',
                'order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'kalte',
                'company' => 'KALTE',
                'logo' => 'img/logos/kalte.jpg',
                'role' => 'Dirección Técnica',
                'text' => 'Nos impresiona su rigor operativo y la trazabilidad en todo momento. Con SELOASA sabemos que el producto está en buenas manos.',
                'status' => 'published',
                'order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'gsk',
                'company' => 'GSK',
                'logo' => 'img/logos/gsk.png',
                'role' => 'Gerencia Nacional de Distribución',
                'text' => 'La puntualidad y la visibilidad en tiempo real que ofrecen ha sido una pieza clave para optimizar nuestra distribución.',
                'status' => 'published',
                'order' => 4,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'vitasanitas',
                'company' => 'Vitasanitas',
                'logo' => 'img/logos/vitasanitas.jpg',
                'role' => 'Coordinación de Abasto',
                'text' => 'Nuestros pedidos siempre llegan a tiempo y con la temperatura perfecta. Da gusto colaborar con un equipo tan atento.',
                'status' => 'published',
                'order' => 5,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'octapharma',
                'company' => 'OCTAPHARMA',
                'logo' => 'img/logos/octapharma.png',
                'role' => 'Jefatura de Logística',
                'text' => 'Nos encanta su agilidad y capacidad de respuesta. Su flexibilidad operativa se adapta genial a lo que requerimos día a día.',
                'status' => 'published',
                'order' => 6,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'pg',
                'company' => 'P&G',
                'logo' => 'img/logos/p&g.png',
                'role' => 'Supply Chain México',
                'text' => 'Son sumamente eficientes y profesionales en sus procesos. Transmiten muchísima confianza en cada ruta.',
                'status' => 'published',
                'order' => 7,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'novartis',
                'company' => 'Novartis',
                'logo' => 'img/logos/novartis.png',
                'role' => 'Gestión de Distribución',
                'text' => 'El control de trazabilidad y su estricto apego a las normativas nos dan la seguridad que necesitamos para nuestra distribución.',
                'status' => 'published',
                'order' => 8,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'pharmafrigo',
                'company' => 'Pharma Frigo',
                'logo' => 'img/logos/pharmafrigo.jpg',
                'role' => 'Operaciones Frigoríficas',
                'text' => 'Su experiencia en el manejo de temperatura controlada es sobresaliente. Confiamos a ojos cerrados en su equipo.',
                'status' => 'published',
                'order' => 9,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'alternavida',
                'company' => 'ALTERNAVIDA',
                'logo' => 'img/logos/alternavida.png',
                'role' => 'Gerencia General',
                'text' => 'Valoramos enormemente el trato cercano y la dedicación especial que le ponen a cada uno de nuestros envíos.',
                'status' => 'published',
                'order' => 10,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'sandoz',
                'company' => 'SANDOZ',
                'logo' => 'img/logos/sandoz.png',
                'role' => 'Departamento Médico',
                'text' => 'Gracias a SELOASA, nuestros insumos médicos llegan intactos a su destino, cuidando siempre la calidad final.',
                'status' => 'published',
                'order' => 11,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'bbraun',
                'company' => 'BBRAUN',
                'logo' => 'img/logos/bbraun.png',
                'role' => 'Supply Chain',
                'text' => 'La cadena de frío requiere máxima precisión, y con SELOASA sabemos que nuestra mercancía nunca corre riesgos.',
                'status' => 'published',
                'order' => 12,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'arcar',
                'company' => 'ARCAR',
                'logo' => 'img/logos/arcar.png',
                'role' => 'Gerencia de Operaciones',
                'text' => 'A lo largo de los años nos han demostrado una gran solidez y profesionalismo. Sin duda, son nuestros aliados de confianza.',
                'status' => 'published',
                'order' => 13,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 'vitalmex',
                'company' => 'VITALMEX',
                'logo' => 'img/logos/vitalmex.png',
                'role' => 'Coordinación de Logística',
                'text' => 'Apreciamos mucho la puntualidad y el cuidado impecable que le dan a cada embarque. Cuidan la carga como si fuera propia.',
                'status' => 'published',
                'order' => 14,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];
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

if (!function_exists('admin_get_posts_store')) {
    function admin_get_posts_store(): array
    {
        admin_storage_ensure();

        $default = [
            'updated_at' => date('c'),
            'items' => admin_default_posts(),
        ];

        $store = admin_read_json_file(ADMIN_NOTICIAS_FILE, $default);
        if (!is_array($store)) {
            return $default;
        }

        $items = $store['items'] ?? [];
        if (!is_array($items)) {
            $items = [];
        }

        return [
            'updated_at' => (string) ($store['updated_at'] ?? date('c')),
            'items' => array_values($items),
        ];
    }
}

if (!function_exists('admin_save_posts_store')) {
    function admin_save_posts_store(array $items): bool
    {
        admin_storage_ensure();

        return admin_write_json_file(ADMIN_NOTICIAS_FILE, [
            'updated_at' => date('c'),
            'items' => array_values($items),
        ]);
    }
}

if (!function_exists('admin_find_post_by_id')) {
    function admin_find_post_by_id(string $id): ?array
    {
        $id = strtolower(trim($id));
        $store = admin_get_posts_store();
        foreach ($store['items'] as $post) {
            if (strtolower(trim((string) ($post['id'] ?? ''))) === $id) {
                return $post;
            }
        }
        return null;
    }
}

if (!function_exists('admin_get_popups_store')) {
    function admin_get_popups_store(): array
    {
        admin_storage_ensure();

        $default = [
            'updated_at' => date('c'),
            'items' => admin_default_popups(),
        ];

        $store = admin_read_json_file(ADMIN_POPUPS_FILE, $default);
        if (!is_array($store)) {
            return $default;
        }

        $items = $store['items'] ?? [];
        if (!is_array($items)) {
            $items = [];
        }

        return [
            'updated_at' => (string) ($store['updated_at'] ?? date('c')),
            'items' => array_values($items),
        ];
    }
}

if (!function_exists('admin_save_popups_store')) {
    function admin_save_popups_store(array $items): bool
    {
        admin_storage_ensure();

        return admin_write_json_file(ADMIN_POPUPS_FILE, [
            'updated_at' => date('c'),
            'items' => array_values($items),
        ]);
    }
}

if (!function_exists('admin_get_testimonios_store')) {
    function admin_get_testimonios_store(): array
    {
        admin_storage_ensure();

        $default = [
            'updated_at' => date('c'),
            'items' => admin_default_testimonios(),
        ];

        $store = admin_read_json_file(ADMIN_TESTIMONIOS_FILE, $default);
        if (!is_array($store)) {
            return $default;
        }

        $items = $store['items'] ?? [];
        if (!is_array($items)) {
            $items = [];
        }

        return [
            'updated_at' => (string) ($store['updated_at'] ?? date('c')),
            'items' => array_values($items),
        ];
    }
}

if (!function_exists('admin_save_testimonios_store')) {
    function admin_save_testimonios_store(array $items): bool
    {
        admin_storage_ensure();

        return admin_write_json_file(ADMIN_TESTIMONIOS_FILE, [
            'updated_at' => date('c'),
            'items' => array_values($items),
        ]);
    }
}

if (!function_exists('admin_find_popup_by_id')) {
    function admin_find_popup_by_id(string $id): ?array
    {
        $id = strtolower(trim($id));
        $store = admin_get_popups_store();
        foreach ($store['items'] as $popup) {
            if (strtolower(trim((string) ($popup['id'] ?? ''))) === $id) {
                return $popup;
            }
        }
        return null;
    }
}

if (!function_exists('admin_get_postulaciones_store')) {
    function admin_get_postulaciones_store(): array
    {
        admin_storage_ensure();

        $default = [
            'updated_at' => date('c'),
            'items' => [],
        ];

        $store = admin_read_json_file(ADMIN_POSTULACIONES_FILE, $default);
        if (!is_array($store)) {
            return $default;
        }

        $items = $store['items'] ?? [];
        if (!is_array($items)) {
            $items = [];
        }

        return [
            'updated_at' => (string) ($store['updated_at'] ?? date('c')),
            'items' => array_values($items),
        ];
    }
}

if (!function_exists('admin_save_postulaciones_store')) {
    function admin_save_postulaciones_store(array $items): bool
    {
        admin_storage_ensure();

        return admin_write_json_file(ADMIN_POSTULACIONES_FILE, [
            'updated_at' => date('c'),
            'items' => array_values($items),
        ]);
    }
}

if (!function_exists('admin_append_postulacion')) {
    function admin_append_postulacion(array $record): bool
    {
        $store = admin_get_postulaciones_store();
        $items = $store['items'];

        $record['id'] = count($items) + 1;
        $record['created_at'] = $record['created_at'] ?? date('c');
        $record['status'] = $record['status'] ?? 'nuevo';

        array_unshift($items, $record);

        return admin_save_postulaciones_store($items);
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

        if ($authenticated && $fingerprint !== '' && hash_equals($fingerprint, admin_session_fingerprint())) {
            return true;
        }

        // Respaldo por cabecera Authorization: Bearer o X-Admin-Token
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
        if ($authHeader !== '') {
            $token = str_starts_with($authHeader, 'Bearer ') ? substr($authHeader, 7) : $authHeader;
            $expectedToken = admin_access_token();
            if ($expectedToken !== '' && hash_equals($expectedToken, trim($token))) {
                return true;
            }
        }

        return false;
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
