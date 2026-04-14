<?php

use PHPMailer\PHPMailer\PHPMailer;

if (!function_exists('mail_env')) {
    function mail_env(string $key, ?string $default = null): ?string
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

        if ($value === false || $value === null) {
            return $default;
        }

        $value = trim((string) $value);
        return $value === '' ? $default : $value;
    }
}

if (!function_exists('mail_env_int')) {
    function mail_env_int(string $key, int $default): int
    {
        $value = mail_env($key);
        return $value !== null && ctype_digit($value) ? (int) $value : $default;
    }
}

if (!function_exists('configure_site_mailer')) {
    function configure_site_mailer(PHPMailer $mail, string $fromName): void
    {
        $username = mail_env('SMTP_USERNAME', 'gadiel.palma@seloasa.com.mx');
        $fromEmail = mail_env('SMTP_FROM_EMAIL', $username);

        $mail->isSMTP();
        $mail->Host = mail_env('SMTP_HOST', 'smtp.office365.com');
        $mail->SMTPAuth = true;
        $mail->Username = $username;
        $mail->Password = mail_env('SMTP_PASSWORD', 'i2q%nK32x=Kv');
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = mail_env_int('SMTP_PORT', 587);
        $mail->CharSet = 'UTF-8';
        $mail->Timeout = mail_env_int('SMTP_TIMEOUT', 20);

        $mail->setFrom($fromEmail, $fromName);
    }
}

if (!function_exists('add_site_mail_recipients')) {
    function add_site_mail_recipients(PHPMailer $mail, string $recipients): void
    {
        foreach (preg_split('/\s*,\s*/', trim($recipients)) as $recipient) {
            if ($recipient !== '') {
                $mail->addAddress($recipient);
            }
        }
    }
}

if (!function_exists('log_mail_error')) {
    function log_mail_error(string $context, Throwable $error, PHPMailer $mail): void
    {
        $logPath = __DIR__ . '/logs/mail_errors.log';
        $smtpError = [];
        $smtp = $mail->getSMTPInstance();

        if (is_object($smtp) && method_exists($smtp, 'getError')) {
            $smtpError = array_filter((array) $smtp->getError(), static function ($value) {
                return $value !== null && $value !== '';
            });
        }

        $parts = [
            sprintf('[%s] %s error: %s', date('Y-m-d H:i:s'), $context, $error->getMessage()),
        ];

        if (!empty($mail->ErrorInfo)) {
            $parts[] = 'PHPMailer: ' . $mail->ErrorInfo;
        }

        if (!empty($smtpError)) {
            $parts[] = 'SMTP detail: ' . json_encode($smtpError, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        $parts[] = 'SMTP host: ' . ($mail->Host ?? '');
        $parts[] = 'SMTP user: ' . ($mail->Username ?? '');

        $message = implode(' | ', $parts) . "\n";

        @file_put_contents($logPath, $message, FILE_APPEND);
    }
}

if (!function_exists('set_flash_cookie')) {
    function set_flash_cookie(string $name, string $value, int $ttl = 60): void
    {
        $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

        if (PHP_VERSION_ID >= 70300) {
            setcookie($name, $value, [
                'expires' => time() + $ttl,
                'path' => '/',
                'secure' => $secure,
                'httponly' => false,
                'samesite' => 'Lax',
            ]);
            return;
        }

        setcookie($name, $value, time() + $ttl, '/');
    }
}

if (!function_exists('redirect_with_flash_status')) {
    function redirect_with_flash_status(string $location, string $cookieName, string $status): void
    {
        set_flash_cookie($cookieName, $status);
        header("Location: {$location}");
        exit;
    }
}

if (!function_exists('mail_html_escape')) {
    function mail_html_escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('attach_brand_logo')) {
    function attach_brand_logo(PHPMailer $mail): ?string
    {
        $logoCandidates = [
            __DIR__ . '/../img/logotipo.png',
            __DIR__ . '/../img/logo.png',
        ];

        foreach ($logoCandidates as $logoPath) {
            if (!is_file($logoPath)) {
                continue;
            }

            $logoCid = 'seloasa-brand-logo';
            $mail->addEmbeddedImage($logoPath, $logoCid, basename($logoPath), 'base64', 'image/png');
            return $logoCid;
        }

        return null;
    }
}

if (!function_exists('build_email_fields_html')) {
    function build_email_fields_html(array $fields): string
    {
        $rows = '';

        foreach ($fields as $field) {
            $label = mail_html_escape((string) ($field['label'] ?? ''));
            $value = trim((string) ($field['value'] ?? ''));

            if ($label === '' || $value === '') {
                continue;
            }

            $rows .= sprintf(
                '<tr>
                    <td style="padding:0 0 18px;vertical-align:top;">
                        <div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#909290;">%s</div>
                        <div style="margin-top:6px;font-size:16px;line-height:24px;color:#1f252b;">%s</div>
                    </td>
                </tr>',
                $label,
                nl2br(mail_html_escape($value), false)
            );
        }

        return $rows;
    }
}

if (!function_exists('build_email_highlights_html')) {
    function build_email_highlights_html(array $highlights): string
    {
        $items = '';

        foreach ($highlights as $highlight) {
            $label = mail_html_escape((string) ($highlight['label'] ?? ''));
            $value = trim((string) ($highlight['value'] ?? ''));

            if ($label === '' || $value === '') {
                continue;
            }

            $items .= sprintf(
                '<td style="padding:0 8px 12px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
                        <tr>
                            <td style="background:#fff4f1;border:1px solid #f4cdc4;border-radius:14px;padding:12px 16px;">
                                <div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#bf2f0f;">%s</div>
                                <div style="margin-top:4px;font-size:14px;line-height:21px;font-weight:700;color:#1f252b;">%s</div>
                            </td>
                        </tr>
                    </table>
                </td>',
                $label,
                mail_html_escape($value)
            );
        }

        if ($items === '') {
            return '';
        }

        return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;border-collapse:collapse;"><tr>' . $items . '</tr></table>';
    }
}

if (!function_exists('build_corporate_email_html')) {
    function build_corporate_email_html(
        string $eyebrow,
        string $title,
        string $intro,
        array $fields,
        array $highlights = [],
        ?array $messageBlock = null,
        ?string $footerNote = null,
        ?string $logoCid = null
    ): string {
        $eyebrowHtml = mail_html_escape($eyebrow);
        $titleHtml = mail_html_escape($title);
        $introHtml = nl2br(mail_html_escape($intro), false);
        $fieldsHtml = build_email_fields_html($fields);
        $highlightsHtml = build_email_highlights_html($highlights);
        $logoHtml = $logoCid
            ? '<img src="cid:' . mail_html_escape($logoCid) . '" alt="Seloasa" width="164" style="display:block;width:164px;max-width:100%;height:auto;border:0;">'
            : '<div style="font-size:18px;line-height:24px;font-weight:700;letter-spacing:0.04em;color:#1f252b;">Servicios Logísticos Alsera</div>';

        $messageHtml = '';
        if (!empty($messageBlock['label']) && !empty($messageBlock['content'])) {
            $messageHtml = sprintf(
                '<tr>
                    <td style="padding:0 32px 32px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" style="border-collapse:collapse;background:#f7f7f7;border:1px solid #e6e9ec;border-radius:18px;">
                            <tr>
                                <td style="padding:22px 24px;">
                                    <div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#e43b14;">%s</div>
                                    <div style="margin-top:10px;font-size:15px;line-height:25px;color:#3e3f3f;">%s</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>',
                mail_html_escape((string) $messageBlock['label']),
                nl2br(mail_html_escape((string) $messageBlock['content']), false)
            );
        }

        $footerHtml = '';
        if ($footerNote !== null && trim($footerNote) !== '') {
            $footerHtml = sprintf(
                '<div style="margin-top:12px;font-size:12px;line-height:20px;color:#7a8086;">%s</div>',
                nl2br(mail_html_escape($footerNote), false)
            );
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$titleHtml}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f6f7;font-family:Arial,Helvetica,sans-serif;color:#1f252b;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#f5f6f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px;border-collapse:collapse;">
          <tr>
            <td style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #ececec;box-shadow:0 18px 45px rgba(31,37,43,0.08);">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:0;background:#ffffff;border-top:6px solid #e43b14;border-bottom:1px solid #f2e3de;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:28px 32px 30px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                            <tr>
                              <td valign="middle" align="left">{$logoHtml}</td>
                              <td valign="middle" align="right" style="padding-left:16px;">
                                <div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#e43b14;">{$eyebrowHtml}</div>
                              </td>
                            </tr>
                          </table>
                          <div style="margin-top:22px;font-size:30px;line-height:38px;font-weight:700;color:#1f252b;">{$titleHtml}</div>
                          <div style="margin-top:12px;font-size:15px;line-height:24px;color:#5b6167;">{$introHtml}</div>
                          {$highlightsHtml}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 32px 10px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      {$fieldsHtml}
                    </table>
                  </td>
                </tr>
                {$messageHtml}
                <tr>
                  <td style="padding:0 32px 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#fff8f6;border:1px solid #f2d5cc;border-radius:18px;">
                      <tr>
                        <td style="padding:18px 24px;">
                          <div style="font-size:12px;line-height:18px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#bf2f0f;">Canal</div>
                          <div style="margin-top:6px;font-size:14px;line-height:22px;color:#3e3f3f;">Generado automáticamente desde el sitio web de Seloasa.</div>
                          {$footerHtml}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }
}

if (!function_exists('build_plain_text_email')) {
    function build_plain_text_email(
        string $title,
        string $intro,
        array $fields,
        array $highlights = [],
        ?array $messageBlock = null,
        ?string $footerNote = null
    ): string {
        $lines = [$title, str_repeat('=', strlen($title)), '', $intro];

        if (!empty($highlights)) {
            $lines[] = '';
            foreach ($highlights as $highlight) {
                $label = trim((string) ($highlight['label'] ?? ''));
                $value = trim((string) ($highlight['value'] ?? ''));
                if ($label !== '' && $value !== '') {
                    $lines[] = "{$label}: {$value}";
                }
            }
        }

        if (!empty($fields)) {
            $lines[] = '';
            foreach ($fields as $field) {
                $label = trim((string) ($field['label'] ?? ''));
                $value = trim((string) ($field['value'] ?? ''));
                if ($label !== '' && $value !== '') {
                    $lines[] = "{$label}: {$value}";
                }
            }
        }

        if (!empty($messageBlock['label']) && !empty($messageBlock['content'])) {
            $lines[] = '';
            $lines[] = (string) $messageBlock['label'] . ':';
            $lines[] = (string) $messageBlock['content'];
        }

        $lines[] = '';
        $lines[] = 'Canal: Generado automáticamente desde el sitio web de Seloasa.';

        if ($footerNote !== null && trim($footerNote) !== '') {
            $lines[] = $footerNote;
        }

        return implode("\n", $lines);
    }
}
