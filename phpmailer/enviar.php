<?php
// Configuración del envío de correo con PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$basePath = __DIR__;

$phpMailerFile = $basePath . '/PHPMailer.php';
$smtpFile = $basePath . '/SMTP.php';
$exceptionFile = $basePath . '/Exception.php';

if (!file_exists($phpMailerFile) || !file_exists($smtpFile) || !file_exists($exceptionFile)) {
    http_response_code(500);
    exit('Instala la librería PHPMailer en la carpeta phpmailer/.');
}

require $phpMailerFile;
require $smtpFile;
require $exceptionFile;

$nombre  = $_POST['nombre'] ?? $_POST['name'] ?? '';
$correo  = $_POST['correo'] ?? $_POST['email'] ?? '';
$mensaje = $_POST['mensaje'] ?? $_POST['message'] ?? '';
$empresa = $_POST['empresa'] ?? $_POST['company'] ?? '';
$telefono = $_POST['telefono'] ?? $_POST['phone'] ?? '';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Método no permitido.');
}

if (empty($nombre) || empty($correo) || empty($mensaje)) {
    http_response_code(422);
    exit('Faltan datos en el formulario.');
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    exit('El correo proporcionado no es válido.');
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.tuservidor.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'tucorreo@fusiblesproteccion.com.mx';
    $mail->Password = 'TU_PASSWORD';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    $mail->setFrom('tucorreo@fusiblesproteccion.com.mx', 'Sitio Web Fusibles Protección');
    $mail->addAddress('ventas@fusiblesproteccion.com.mx', 'Fusibles Protección');

    $mail->isHTML(true);
    $mail->Subject = 'Nuevo mensaje desde el sitio web';
    $mail->Body    = "
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> " . htmlspecialchars($nombre) . '</p>' .
        ($empresa ? '<p><strong>Empresa:</strong> ' . htmlspecialchars($empresa) . '</p>' : '') .
        ($telefono ? '<p><strong>Teléfono:</strong> ' . htmlspecialchars($telefono) . '</p>' : '') .
        '<p><strong>Correo:</strong> ' . htmlspecialchars($correo) . '</p>' .
        '<p><strong>Mensaje:</strong><br>' . nl2br(htmlspecialchars($mensaje)) . '</p>';

    $mail->AltBody = "Nombre: {$nombre}\n" .
        ($empresa ? "Empresa: {$empresa}\n" : '') .
        ($telefono ? "Teléfono: {$telefono}\n" : '') .
        "Correo: {$correo}\nMensaje:\n{$mensaje}";

    $mail->send();
    echo 'Mensaje enviado correctamente. ¡Gracias por contactarnos!';
} catch (Exception $e) {
    http_response_code(500);
    echo 'Error al enviar el mensaje: ' . $mail->ErrorInfo;
}
