<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../vendor/autoload.php'; // asegúrate de que Composer esté instalado
require __DIR__ . '/mail_helper.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header('Location: ../index.html?status=error');
    exit;
}

// Sanitizar entrada
$nombre  = trim((string) ($_POST['name'] ?? ''));
$correo  = trim((string) filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL));
$asunto  = trim((string) ($_POST['subject'] ?? ($_POST['asunto'] ?? 'Sin asunto')));
$mensaje = trim((string) ($_POST['message'] ?? ($_POST['notes'] ?? '')));

// Detectar origen (inicio o contacto)
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$origen = (strpos($referer, 'contact') !== false) ? 'contact/' : 'index.html';

$mail = new PHPMailer(true);

try {
    configure_site_mailer($mail, 'Formulario Web Seloasa');
    add_site_mail_recipients($mail, mail_env('CONTACT_FORM_TO', 'yasser.hernandez@seloasa.com.mx'));
    $brandLogoCid = attach_brand_logo($mail);

    if (filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        $mail->addReplyTo($correo, $nombre !== '' ? $nombre : $correo);
    }

    // Contenido del correo
    $mail->isHTML(true);
    $mail->Subject = "Nuevo mensaje: $asunto";
    $mail->Body = build_corporate_email_html(
        'Formulario web',
        'Nuevo mensaje de contacto',
        'Se recibió un nuevo mensaje desde el formulario de contacto del sitio web de Seloasa.',
        [
            ['label' => 'Nombre', 'value' => $nombre !== '' ? $nombre : 'No especificado'],
            ['label' => 'Correo electrónico', 'value' => $correo !== '' ? $correo : 'No especificado'],
        ],
        [
            ['label' => 'Asunto', 'value' => $asunto !== '' ? $asunto : 'Sin asunto'],
        ],
        [
            'label' => 'Mensaje',
            'content' => $mensaje !== '' ? $mensaje : 'Sin contenido.',
        ],
        'Registro generado desde el formulario de contacto del sitio web.',
        $brandLogoCid
    );
    $mail->AltBody = build_plain_text_email(
        'Nuevo mensaje de contacto',
        'Se recibió un nuevo mensaje desde el formulario de contacto del sitio web de Seloasa.',
        [
            ['label' => 'Nombre', 'value' => $nombre !== '' ? $nombre : 'No especificado'],
            ['label' => 'Correo electrónico', 'value' => $correo !== '' ? $correo : 'No especificado'],
        ],
        [
            ['label' => 'Asunto', 'value' => $asunto !== '' ? $asunto : 'Sin asunto'],
        ],
        [
            'label' => 'Mensaje',
            'content' => $mensaje !== '' ? $mensaje : 'Sin contenido.',
        ],
        'Registro generado desde el formulario de contacto del sitio web.'
    );

    $mail->send();
    header("Location: ../$origen?status=success");
    exit;
} catch (Exception $e) {
    log_mail_error('enviar_formulario', $e, $mail);
    header("Location: ../$origen?status=error");
    exit;
}
?>

