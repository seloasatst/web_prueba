<?php
/**
 * SELOASA - Configuración de SEO, Google Analytics y Google Search Console
 * Expone la configuración de variables de entorno de forma segura para el frontend.
 */

require_once __DIR__ . '/mail_helper.php';

$gaId = mail_env('GA_MEASUREMENT_ID', 'G-XXXXXXXXXX');
$gscCode = mail_env('GSC_VERIFICATION_CODE', '');

if (isset($_GET['format']) && $_GET['format'] === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ga_measurement_id' => $gaId,
        'gsc_verification_code' => $gscCode
    ], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: public, max-age=300');
?>
(function() {
    window.SELOASA_SEO = {
        gaMeasurementId: <?= json_encode($gaId, JSON_UNESCAPED_SLASHES) ?>,
        gscVerificationCode: <?= json_encode($gscCode, JSON_UNESCAPED_SLASHES) ?>
    };
})();
