<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../vendor/autoload.php';
require __DIR__ . '/mail_helper.php';
require __DIR__ . '/admin_helper.php';

const CAREERS_STATUS_COOKIE = 'career_application_status';

function redirect_application_status(string $sourcePage, string $status): void
{
    redirect_with_flash_status("../{$sourcePage}/", CAREERS_STATUS_COOKIE, $status);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect_application_status('careers', 'error');
}

$fullName = trim((string) ($_POST['full_name'] ?? ''));
$fullName = preg_replace('/\s+/u', ' ', $fullName);
$email = filter_var((string) ($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$email = trim($email);
$phone = trim((string) ($_POST['phone'] ?? ''));
$vacancyId = trim((string) ($_POST['vacancy'] ?? ''));
$sourcePage = trim((string) ($_POST['source_page'] ?? 'careers'));
$phoneDigits = preg_replace('/\D+/', '', $phone);
$allowedVacancies = admin_public_vacancy_map(); /*
    'coordinador-monitoreo-logistico' => 'Coordinador de Monitoreo Logístico',
    'auxiliar-almacen-farmaceutico' => 'Auxiliar de Almacén Farmacéutico',
    'operador-transporte-refrigerado' => 'Operador de Transporte Refrigerado',
*/

if ($sourcePage !== 'careers') {
    $sourcePage = 'careers';
}

if ($fullName === '' || $email === '' || $phone === '' || $vacancyId === '' || empty($_FILES['cv'])) {
    redirect_application_status($sourcePage, 'error');
}

if (!preg_match('/^\S+\s+\S+/u', $fullName) || !preg_match('/^[\p{L}\p{M}\s.\'-]{5,120}$/u', $fullName)) {
    redirect_application_status($sourcePage, 'invalid_name');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirect_application_status($sourcePage, 'invalid_email');
}

if (strlen($phoneDigits) < 10 || strlen($phoneDigits) > 15) {
    redirect_application_status($sourcePage, 'invalid_phone');
}

if (!array_key_exists($vacancyId, $allowedVacancies)) {
    redirect_application_status($sourcePage, 'invalid_vacancy');
}

$cvFile = $_FILES['cv'];

if (!isset($cvFile['error']) || $cvFile['error'] !== UPLOAD_ERR_OK) {
    redirect_application_status($sourcePage, 'upload_error');
}

$maxSize = 5 * 1024 * 1024;
if (($cvFile['size'] ?? 0) > $maxSize) {
    redirect_application_status($sourcePage, 'file_too_large');
}

$originalName = (string) ($cvFile['name'] ?? '');
$extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
$allowedExtensions = ['pdf', 'doc', 'docx'];

if (!in_array($extension, $allowedExtensions, true)) {
    redirect_application_status($sourcePage, 'invalid_file');
}

$safeVacancyTitle = $allowedVacancies[$vacancyId];
$safeFileName = preg_replace('/[^A-Za-z0-9._-]/', '_', $originalName);

$mail = new PHPMailer(true);

try {
    configure_site_mailer($mail, 'Postulaciones Web SELOASA');
    add_site_mail_recipients($mail, mail_env('CAREERS_FORM_TO', 'gadiel.palma@SELOASA.com.mx'));
    $brandLogoCid = attach_brand_logo($mail);
    $mail->addAttachment($cvFile['tmp_name'], $safeFileName);

    $mail->isHTML(true);
    $mail->Subject = "Nueva postulación: {$safeVacancyTitle}";
    $mail->Body = build_corporate_email_html(
        'Postulación web',
        'Nueva postulación recibida',
        'Se registró una nueva candidatura desde la bolsa de trabajo de SELOASA. A continuación encontrarás los datos de la persona postulante.',
        [
            ['label' => 'Nombre completo', 'value' => $fullName],
            ['label' => 'Correo electrónico', 'value' => $email],
            ['label' => 'Teléfono', 'value' => $phone],
        ],
        [
            ['label' => 'Vacante', 'value' => $safeVacancyTitle],
            ['label' => 'CV adjunto', 'value' => $safeFileName],
        ],
        null,
        'Uso interno para seguimiento del proceso de reclutamiento.',
        $brandLogoCid
    );
    $mail->AltBody = build_plain_text_email(
        'Nueva postulación recibida',
        'Se registró una nueva candidatura desde la bolsa de trabajo de SELOASA.',
        [
            ['label' => 'Nombre completo', 'value' => $fullName],
            ['label' => 'Correo electrónico', 'value' => $email],
            ['label' => 'Teléfono', 'value' => $phone],
        ],
        [
            ['label' => 'Vacante', 'value' => $safeVacancyTitle],
            ['label' => 'CV adjunto', 'value' => $safeFileName],
        ],
        null,
        'Uso interno para seguimiento del proceso de reclutamiento.'
    );

    $mail->send();
    redirect_application_status($sourcePage, 'success');
} catch (Exception $e) {
    log_mail_error('enviar_postulacion', $e, $mail);
    redirect_application_status($sourcePage, 'error');
}
?>
