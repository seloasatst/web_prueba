<?php
/**
 * SELOASA - Conexión Centralizada a Base de Datos MySQL (PDO)
 * Conecta a la base de datos `website` de XAMPP y asegura las tablas necesarias
 * para Noticias, Pop-ups, Bolsa de Trabajo y Postulaciones.
 */

if (!function_exists('load_site_env')) {
    function load_site_env(?string $path = null): void
    {
        static $loaded = false;
        if ($loaded) {
            return;
        }
        $loaded = true;

        if ($path === null) {
            $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
        }

        if (!file_exists($path) || !is_readable($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val);

                if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                    (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                    $val = substr($val, 1, -1);
                }

                if (!array_key_exists($key, $_SERVER) && !array_key_exists($key, $_ENV)) {
                    putenv("{$key}={$val}");
                    $_ENV[$key] = $val;
                    $_SERVER[$key] = $val;
                }
            }
        }
    }
}

if (!function_exists('get_db_connection')) {
    function get_db_connection(): PDO
    {
        static $pdoInstance = null;
        if ($pdoInstance !== null) {
            return $pdoInstance;
        }

        // Cargar variables de entorno desde archivo .env si existe
        load_site_env();

        // Credenciales XAMPP / Variables de entorno
        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $port = getenv('DB_PORT') ?: '3306';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
        $dbname = getenv('DB_NAME') ?: 'website';

        // 1. Conexión al servidor MySQL para garantizar existencia de la BD
        try {
            $rawPdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            $rawPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (PDOException $e) {
            error_log("Error al conectar/crear BD MySQL: " . $e->getMessage());
            throw $e;
        }

        // 2. Conexión directa a la BD website
        try {
            $pdoInstance = new PDO("mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4", $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);

            // 3. Garantizar tablas y datos iniciales
            ensure_database_schema($pdoInstance);

            return $pdoInstance;
        } catch (PDOException $e) {
            error_log("Error al conectar a {$dbname}: " . $e->getMessage());
            throw $e;
        }
    }
}

if (!function_exists('ensure_database_schema')) {
    function ensure_database_schema(PDO $pdo): void
    {
        // -------------------------------------------------------------
        // TABLA: NOTICIAS / BLOG
        // -------------------------------------------------------------
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `noticias` (
                `id` VARCHAR(100) NOT NULL PRIMARY KEY,
                `type` VARCHAR(50) NOT NULL DEFAULT 'comunicado',
                `category` VARCHAR(100) NOT NULL DEFAULT 'Comunicado Oficial',
                `badge_class` VARCHAR(50) NOT NULL DEFAULT 'badge-pill-comunicado',
                `status` VARCHAR(20) NOT NULL DEFAULT 'published',
                `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
                `title` VARCHAR(255) NOT NULL,
                `summary` TEXT,
                `content` LONGTEXT,
                `date` VARCHAR(50) DEFAULT NULL,
                `dept` VARCHAR(150) DEFAULT NULL,
                `read_time` VARCHAR(50) DEFAULT '3 min',
                `image` VARCHAR(255) DEFAULT 'img/patio_unidades_dia_banner.jpg',
                `pdf_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `pdf_title` VARCHAR(255) DEFAULT 'Documento Oficial PDF',
                `pdf_url` VARCHAR(255) DEFAULT 'docs_pdf/protocolo_seguridad.pdf',
                `pdf_btn_text` VARCHAR(100) DEFAULT 'Descargar Circular en PDF',
                `pdf_desc` TEXT,
                `normativa_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `normativa_title` VARCHAR(255) DEFAULT 'Marco Normativo',
                `normativa_items` TEXT,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (`status`),
                INDEX idx_type (`type`),
                INDEX idx_featured (`is_featured`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // -------------------------------------------------------------
        // TABLA: POP-UPS Y AVISOS DEL SITIO
        // -------------------------------------------------------------
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `popups` (
                `id` VARCHAR(100) NOT NULL PRIMARY KEY,
                `title` VARCHAR(255) NOT NULL,
                `subtitle` VARCHAR(255) DEFAULT NULL,
                `type` VARCHAR(50) NOT NULL DEFAULT 'alerta',
                `layout` VARCHAR(50) NOT NULL DEFAULT 'top',
                `message` LONGTEXT,
                `image` VARCHAR(255) DEFAULT 'img/patio_unidades_dia_banner.jpg',
                `btn_primary_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `btn_primary_text` VARCHAR(100) DEFAULT 'Ver Comunicado Oficial Completo',
                `btn_primary_url` VARCHAR(255) DEFAULT 'blog/comunicado-gdp-2026',
                `btn_secondary_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                `btn_secondary_text` VARCHAR(100) DEFAULT 'Entendido, continuar navegando',
                `custom_footer` TEXT,
                `active` TINYINT(1) NOT NULL DEFAULT 0,
                `frequency` VARCHAR(50) NOT NULL DEFAULT 'session',
                `delay` FLOAT NOT NULL DEFAULT 1.5,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_active (`active`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // -------------------------------------------------------------
        // TABLA: BOLSA DE TRABAJO / VACANTES
        // -------------------------------------------------------------
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `vacantes` (
                `id` VARCHAR(100) NOT NULL PRIMARY KEY,
                `status` VARCHAR(20) NOT NULL DEFAULT 'published',
                `sort_order` INT NOT NULL DEFAULT 10,
                `title` VARCHAR(255) NOT NULL,
                `area` VARCHAR(100) NOT NULL DEFAULT 'Operaciones',
                `mode` VARCHAR(100) NOT NULL DEFAULT 'Presencial',
                `location` VARCHAR(150) NOT NULL DEFAULT 'Lerma, Estado de México',
                `schedule` VARCHAR(100) NOT NULL DEFAULT 'Tiempo completo',
                `recipient_emails` VARCHAR(255) DEFAULT 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx',
                `summary` TEXT,
                `points` LONGTEXT,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (`status`),
                INDEX idx_sort (`sort_order`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // -------------------------------------------------------------
        // TABLA: POSTULACIONES / CVs RECIBIDOS
        // -------------------------------------------------------------
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `postulaciones` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `vacante_id` VARCHAR(100) DEFAULT NULL,
                `vacante_title` VARCHAR(255) DEFAULT NULL,
                `candidate_name` VARCHAR(150) NOT NULL,
                `candidate_email` VARCHAR(150) NOT NULL,
                `candidate_phone` VARCHAR(50) DEFAULT NULL,
                `candidate_notes` TEXT,
                `cv_filename` VARCHAR(255) DEFAULT NULL,
                `cv_filepath` VARCHAR(255) DEFAULT NULL,
                `recipient_emails` VARCHAR(255) DEFAULT NULL,
                `status` VARCHAR(50) NOT NULL DEFAULT 'nuevo',
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_vacante (`vacante_id`),
                INDEX idx_status (`status`),
                INDEX idx_created (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Sembrar datos iniciales si las tablas están vacías
        seed_initial_data_if_needed($pdo);
    }
}

if (!function_exists('seed_initial_data_if_needed')) {
    function seed_initial_data_if_needed(PDO $pdo): void
    {
        // 1. Sembrar Noticias si está vacía
        $noticiasCount = (int)$pdo->query("SELECT COUNT(*) FROM `noticias`")->fetchColumn();
        if ($noticiasCount === 0) {
            $defaultNoticias = [
                [
                    'id' => 'featured',
                    'type' => 'comunicado',
                    'category' => 'Comunicado Oficial',
                    'badge_class' => 'badge-pill-comunicado',
                    'status' => 'published',
                    'is_featured' => 1,
                    'title' => 'Actualización de Protocolos de Seguridad y Cumplimiento Normativo COFEPRIS & GDP 2026',
                    'summary' => 'Informamos a nuestros clientes y socios comerciales sobre la actualización integral de los protocolos de control térmico, trazabilidad y blindaje en todas nuestras rutas activas.',
                    'content' => '<p>Como parte de nuestro compromiso continuo con la excelencia operativa y la estricta adherencia a las normas vigentes de COFEPRIS y las directrices internacionales GDP (Buenas Prácticas de Distribución), SELOASA ha concluido satisfactoriamente la auditoría y homologación de su flota de transporte refrigerado y seco para el periodo 2026.</p><p>Esta disposición garantiza el monitoreo de temperatura en tiempo real con doble sensor de telemetría activa, resguardo de cadena de custodia y trazabilidad ininterrumpida desde el punto de origen hasta su destino final.</p>',
                    'date' => 'Mayo 2026',
                    'dept' => 'Dirección General & Aseguramiento de Calidad',
                    'read_time' => '3 min',
                    'image' => 'img/patio_unidades_dia_banner.jpg',
                    'pdf_enabled' => 1,
                    'pdf_title' => 'Documento Oficial PDF',
                    'pdf_url' => 'docs_pdf/protocolo_seguridad.pdf',
                    'pdf_btn_text' => 'Descargar Circular en PDF',
                    'pdf_desc' => 'Descarga la circular completa membretada con anexos técnicos para auditorías.',
                    'normativa_enabled' => 1,
                    'normativa_title' => 'Marco Normativo',
                    'normativa_items' => "NOM-059-SSA1: Buenas prácticas de distribución.\nNOM-072-SSA1: Trazabilidad e insumos para la salud.\nDirectrices GDP: Monitoreo térmico continuo.",
                ],
                [
                    'id' => 'expansion-flota-termo-2026',
                    'type' => 'noticia',
                    'category' => 'Noticia Operativa',
                    'badge_class' => 'badge-pill-noticia',
                    'status' => 'published',
                    'is_featured' => 0,
                    'title' => 'Incorporación de Nuevas Unidades Refrigeradas con Monitoreo Satelital Dual',
                    'summary' => 'Ampliamos nuestra capacidad operativa con unidades de última generación equipadas con control independiente de temperatura de -20°C a +25°C.',
                    'content' => '<p>SELOASA incorpora a su parque vehicular nuevas unidades diseñadas para atender la creciente demanda de transporte farmacéutico especializado. Cada unidad cuenta con telemetría satelital redundante, sensores calibrados con trazabilidad CENAM y alertas instantáneas ante cualquier fluctuación térmica.</p>',
                    'date' => 'Abril 2026',
                    'dept' => 'Gerencia de Tráfico y Monitoreo',
                    'read_time' => '2 min',
                    'image' => 'img/patio_unidades_noche_banner.jpg',
                    'pdf_enabled' => 0,
                    'pdf_title' => 'Ficha Técnica',
                    'pdf_url' => '',
                    'pdf_btn_text' => 'Descargar Ficha',
                    'pdf_desc' => '',
                    'normativa_enabled' => 0,
                    'normativa_title' => '',
                    'normativa_items' => '',
                ],
                [
                    'id' => 'cadena-frio-retos-soluciones',
                    'type' => 'blog',
                    'category' => 'Blog Farma',
                    'badge_class' => 'badge-pill-blog',
                    'status' => 'published',
                    'is_featured' => 0,
                    'title' => 'Claves Críticas para Preservar la Estabilidad de Medicamentos Biológicos en Ruta',
                    'summary' => 'Análisis técnico sobre la prevención de excursiones de temperatura, validación de empaques térmicos y calibración de instrumentos.',
                    'content' => '<p>El transporte de medicamentos biológicos y vacunas requiere un control térmico milimétrico entre 2°C y 8°C. En este artículo técnico, el equipo de validación de SELOASA comparte las mejores prácticas para evitar puntos críticos durante la estiba, maniobras de carga y tránsito en carretera.</p>',
                    'date' => 'Marzo 2026',
                    'dept' => 'Aseguramiento de Calidad Farma',
                    'read_time' => '4 min',
                    'image' => 'img/feature.jpg',
                    'pdf_enabled' => 0,
                    'pdf_title' => '',
                    'pdf_url' => '',
                    'pdf_btn_text' => '',
                    'pdf_desc' => '',
                    'normativa_enabled' => 0,
                    'normativa_title' => '',
                    'normativa_items' => '',
                ]
            ];

            $insertStmt = $pdo->prepare("
                INSERT INTO `noticias` (
                    `id`, `type`, `category`, `badge_class`, `status`, `is_featured`,
                    `title`, `summary`, `content`, `date`, `dept`, `read_time`, `image`,
                    `pdf_enabled`, `pdf_title`, `pdf_url`, `pdf_btn_text`, `pdf_desc`,
                    `normativa_enabled`, `normativa_title`, `normativa_items`
                ) VALUES (
                    :id, :type, :category, :badge_class, :status, :is_featured,
                    :title, :summary, :content, :date, :dept, :read_time, :image,
                    :pdf_enabled, :pdf_title, :pdf_url, :pdf_btn_text, :pdf_desc,
                    :normativa_enabled, :normativa_title, :normativa_items
                )
            ");

            foreach ($defaultNoticias as $item) {
                $insertStmt->execute($item);
            }
        }

        // 2. Sembrar Popups si está vacía
        $popupsCount = (int)$pdo->query("SELECT COUNT(*) FROM `popups`")->fetchColumn();
        if ($popupsCount === 0) {
            $defaultPopups = [
                [
                    'id' => 'popup-cofepris-2026',
                    'title' => 'Actualización Normativa COFEPRIS & GDP 2026',
                    'subtitle' => 'Aviso Oficial de Seguridad y Cumplimiento Farmacéutico',
                    'type' => 'alerta',
                    'layout' => 'top',
                    'message' => '<p>Informamos a todos nuestros clientes y socios comerciales sobre la homologación de nuevos estándares de aseguramiento de calidad y cadena de frío con monitoreo satelital en tiempo real 24/7/365 en todas nuestras rutas activas.</p>',
                    'image' => 'img/patio_unidades_dia_banner.jpg',
                    'btn_primary_enabled' => 1,
                    'btn_primary_text' => 'Ver Comunicado Oficial Completo',
                    'btn_primary_url' => 'blog/comunicado-gdp-2026',
                    'btn_secondary_enabled' => 1,
                    'btn_secondary_text' => 'Entendido, continuar navegando',
                    'custom_footer' => '',
                    'active' => 1,
                    'frequency' => 'session',
                    'delay' => 1.5,
                ],
                [
                    'id' => 'popup-temporada-lluvias',
                    'title' => 'Plan de Contingencia Operativa en Temporada de Lluvias',
                    'subtitle' => 'Monitoreo Satelital Híbrido 24/7 en Rutas Nacionales',
                    'type' => 'comunicado',
                    'layout' => 'left',
                    'message' => '<p>Conoce los protocolos de blindaje de flota y redundancia térmica implementados por SELOASA para garantizar entregas farmacéuticas puntuales sin interrupciones por contingencias climáticas.</p>',
                    'image' => 'img/feature.jpg',
                    'btn_primary_enabled' => 1,
                    'btn_primary_text' => 'Consultar Medidas Preventivas',
                    'btn_primary_url' => 'blog/comunicado-gdp-2026',
                    'btn_secondary_enabled' => 1,
                    'btn_secondary_text' => 'Cerrar aviso',
                    'custom_footer' => '',
                    'active' => 0,
                    'frequency' => 'session',
                    'delay' => 2.0,
                ]
            ];

            $insertPopup = $pdo->prepare("
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
            ");

            foreach ($defaultPopups as $pop) {
                $insertPopup->execute($pop);
            }
        }

        // 3. Sembrar Vacantes si está vacía
        $vacantesCount = (int)$pdo->query("SELECT COUNT(*) FROM `vacantes`")->fetchColumn();
        if ($vacantesCount === 0) {
            $defaultVacantes = [
                [
                    'id' => 'coordinador-monitoreo-logistico',
                    'status' => 'published',
                    'sort_order' => 10,
                    'title' => 'Coordinador de Monitoreo Logístico',
                    'area' => 'Monitoreo',
                    'mode' => 'Presencial',
                    'location' => 'Lerma, Estado de México',
                    'schedule' => 'Tiempo completo',
                    'recipient_emails' => 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx',
                    'summary' => 'Responsable de dar seguimiento a la operación diaria, visibilidad de unidades e incidencias durante el trayecto.',
                    'points' => json_encode([
                        'Monitoreo de rutas, GPS y eventos críticos en tiempo real.',
                        'Comunicación con operación y clientes ante desviaciones o alertas.',
                        'Seguimiento de reportes, evidencias y control de indicadores operativos.'
                    ], JSON_UNESCAPED_UNICODE),
                ],
                [
                    'id' => 'auxiliar-almacen-farmaceutico',
                    'status' => 'published',
                    'sort_order' => 20,
                    'title' => 'Auxiliar de Almacén Farmacéutico',
                    'area' => 'Almacén',
                    'mode' => 'Presencial',
                    'location' => 'Lerma, Estado de México',
                    'schedule' => 'Tiempo completo',
                    'recipient_emails' => 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx',
                    'summary' => 'Perfil orientado al manejo seguro de producto, control documental y operación diaria dentro de almacenes especializados.',
                    'points' => json_encode([
                        'Recepción, surtido y acomodo de producto conforme a proceso.',
                        'Control de lotes, caducidades y condiciones de temperatura.',
                        'Apoyo en inventarios, limpieza operativa y trazabilidad.'
                    ], JSON_UNESCAPED_UNICODE),
                ],
                [
                    'id' => 'operador-transporte-refrigerado',
                    'status' => 'published',
                    'sort_order' => 30,
                    'title' => 'Operador de Transporte Refrigerado',
                    'area' => 'Transporte',
                    'mode' => 'Operación en ruta',
                    'location' => 'Cobertura local y foránea',
                    'schedule' => 'Tiempo completo',
                    'recipient_emails' => 'gadiel.palma@SELOASA.com.mx, rh@seloasa.com.mx',
                    'summary' => 'Vacante enfocada en entregas con control de temperatura, cumplimiento documental y operación segura de unidades.',
                    'points' => json_encode([
                        'Traslado de producto sensible bajo lineamientos de cadena de frío.',
                        'Verificación de unidad, evidencias de entrega y documentación de ruta.',
                        'Cumplimiento de protocolos de seguridad y atención al cliente en entrega.'
                    ], JSON_UNESCAPED_UNICODE),
                ]
            ];

            $insertVacante = $pdo->prepare("
                INSERT INTO `vacantes` (
                    `id`, `status`, `sort_order`, `title`, `area`, `mode`, `location`,
                    `schedule`, `recipient_emails`, `summary`, `points`
                ) VALUES (
                    :id, :status, :sort_order, :title, :area, :mode, :location,
                    :schedule, :recipient_emails, :summary, :points
                )
            ");

            foreach ($defaultVacantes as $vac) {
                $insertVacante->execute($vac);
            }
        }
    }
}
