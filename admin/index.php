<?php

require_once __DIR__ . '/../php/admin_helper.php';

admin_start_session();
admin_storage_ensure();

$isConfigured = admin_is_configured();
$isAuthenticated = admin_is_authenticated();
$flash = admin_pull_flash();
$loginError = '';
$formErrors = [];
$formValues = admin_vacancy_form_defaults();
$editId = trim((string) ($_GET['edit'] ?? ''));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = trim((string) ($_POST['action'] ?? ''));
    $csrfToken = (string) ($_POST['csrf_token'] ?? '');

    if (!admin_validate_csrf_token($csrfToken)) {
        if ($action === 'login') {
            $loginError = 'No fue posible validar la sesion. Recarga la pagina e intenta de nuevo.';
        } else {
            admin_flash('danger', 'No fue posible validar la solicitud. Intenta de nuevo.');
            header('Location: index.php');
            exit;
        }
    } elseif ($action === 'login') {
        $result = admin_login((string) ($_POST['access_token'] ?? ''), (string) ($_POST['totp_code'] ?? ''));

        if (!empty($result['success'])) {
            admin_flash('success', 'Acceso concedido. Ya puedes administrar las vacantes.');
            header('Location: index.php');
            exit;
        }

        $loginError = (string) ($result['message'] ?? 'No fue posible iniciar sesion.');
    } elseif ($action === 'logout') {
        admin_logout();
        header('Location: index.php');
        exit;
    } elseif ($isAuthenticated) {
        if ($action === 'save_vacancy') {
            $result = admin_upsert_vacancy($_POST);

            if (!empty($result['success'])) {
                $savedVacancy = $result['vacancy'] ?? [];
                $savedId = (string) ($savedVacancy['id'] ?? '');
                admin_flash('success', !empty($result['created']) ? 'Vacante creada correctamente.' : 'Vacante actualizada correctamente.');
                header('Location: index.php' . ($savedId !== '' ? '?edit=' . rawurlencode($savedId) : ''));
                exit;
            }

            $formErrors = is_array($result['errors'] ?? null) ? $result['errors'] : [];
            $formValues = is_array($result['form'] ?? null) ? $result['form'] : $formValues;
            $editId = (string) ($formValues['existing_id'] ?? '');
        } elseif ($action === 'delete_vacancy') {
            $vacancyId = trim((string) ($_POST['vacancy_id'] ?? ''));

            if (admin_delete_vacancy($vacancyId)) {
                admin_flash('success', 'Vacante eliminada correctamente.');
            } else {
                admin_flash('danger', 'No fue posible eliminar la vacante seleccionada.');
            }

            header('Location: index.php');
            exit;
        }
    }
}

if ($isAuthenticated && empty($formErrors) && $editId !== '') {
    $editingVacancy = admin_find_vacancy_by_id($editId);
    if ($editingVacancy !== null) {
        $formValues = admin_form_values_from_vacancy($editingVacancy);
    }
}

$stats = admin_dashboard_stats();
$vacancies = admin_get_all_vacancies();
$csrfToken = admin_csrf_token();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1.0" name="viewport">
    <title>Admin Vacantes - Seloasa</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <link href="../css/admin.css" rel="stylesheet">
</head>
<body class="admin-shell">
    <div class="admin-bg"></div>
    <main class="admin-main container py-4 py-lg-5">
        <div class="admin-header-card">
            <div class="admin-brand">
                <img src="../img/logotipo.png" alt="Seloasa" class="admin-brand-logo" width="171" height="209">
                <div>
                    <p class="admin-eyebrow mb-2">Panel interno</p>
                    <h1 class="admin-title mb-2">Administracion de vacantes</h1>
                    <p class="admin-subtitle mb-0">Gestiona las publicaciones visibles en la bolsa de trabajo y protege el acceso con token y TOTP compatible con Google Authenticator.</p>
                </div>
            </div>

            <?php if ($isAuthenticated): ?>
                <div class="admin-header-actions">
                    <a class="btn btn-outline-secondary" href="../careers/" target="_blank" rel="noopener noreferrer">Ver bolsa de trabajo</a>
                    <form action="index.php" method="POST" class="d-inline">
                        <input type="hidden" name="csrf_token" value="<?php echo admin_html($csrfToken); ?>">
                        <input type="hidden" name="action" value="logout">
                        <button type="submit" class="btn btn-dark">Cerrar sesion</button>
                    </form>
                </div>
            <?php endif; ?>
        </div>

        <?php if ($flash !== null): ?>
            <div class="alert <?php echo $flash['type'] === 'success' ? 'alert-success' : 'alert-danger'; ?> admin-alert" role="alert">
                <?php echo admin_html((string) $flash['message']); ?>
            </div>
        <?php endif; ?>

        <?php if (!$isConfigured): ?>
            <section class="admin-panel">
                <div class="row g-4 align-items-stretch">
                    <div class="col-lg-7">
                        <h2 class="admin-section-title">Configuracion requerida</h2>
                        <p class="admin-copy mb-3">Antes de abrir el admin necesitas definir un token de acceso y la clave TOTP que usaras en Google Authenticator.</p>
                        <div class="admin-code-card">
                            <code>ADMIN_ACCESS_TOKEN</code>
                            <code>ADMIN_TOTP_SECRET</code>
                        </div>
                        <p class="admin-copy mt-3 mb-2">Opcionalmente puedes documentar internamente estos datos como:</p>
                        <div class="admin-code-card">
                            <code>Ruta del panel: /admin/</code>
                            <code>Segundo paso: codigo TOTP de 6 digitos</code>
                        </div>
                    </div>
                    <div class="col-lg-5">
                        <div class="admin-note-card h-100">
                            <h3 class="admin-note-title">Como configurarlo</h3>
                            <ol class="admin-steps mb-0">
                                <li>Define un valor fuerte en <code>ADMIN_ACCESS_TOKEN</code>.</li>
                                <li>Genera una clave Base32 para <code>ADMIN_TOTP_SECRET</code>.</li>
                                <li>Agrega esa clave manualmente en Google Authenticator como cuenta TOTP.</li>
                                <li>Abre <code>/admin/</code> y entra con ambos factores.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </section>
        <?php elseif (!$isAuthenticated): ?>
            <section class="admin-login-grid">
                <div class="admin-panel">
                    <h2 class="admin-section-title">Acceso seguro</h2>
                    <p class="admin-copy">Ingresa tu token de acceso y el codigo actual de Google Authenticator para abrir el panel.</p>

                    <?php if ($loginError !== ''): ?>
                        <div class="alert alert-danger" role="alert">
                            <?php echo admin_html($loginError); ?>
                        </div>
                    <?php endif; ?>

                    <form action="index.php" method="POST" class="row g-3">
                        <input type="hidden" name="csrf_token" value="<?php echo admin_html($csrfToken); ?>">
                        <input type="hidden" name="action" value="login">

                        <div class="col-12">
                            <label class="form-label" for="adminAccessToken">Token de acceso</label>
                            <input class="form-control form-control-lg" type="password" id="adminAccessToken" name="access_token" autocomplete="off" required>
                        </div>

                        <div class="col-12">
                            <label class="form-label" for="adminTotpCode">Codigo Google Authenticator</label>
                            <input class="form-control form-control-lg" type="text" id="adminTotpCode" name="totp_code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="123456" required>
                        </div>

                        <div class="col-12">
                            <button class="btn btn-admin-primary btn-lg w-100" type="submit">Entrar al admin</button>
                        </div>
                    </form>
                </div>

                <aside class="admin-note-card">
                    <h3 class="admin-note-title">Seguridad del acceso</h3>
                    <ul class="admin-points mb-0">
                        <li>Primer paso: token privado definido en el servidor.</li>
                        <li>Segundo paso: TOTP de 6 digitos compatible con Google Authenticator.</li>
                        <li>Hay bloqueo temporal tras varios intentos fallidos.</li>
                    </ul>
                </aside>
            </section>
        <?php else: ?>
            <section class="row g-4 mb-4">
                <div class="col-md-4">
                    <article class="admin-stat-card">
                        <span class="admin-stat-label">Vacantes totales</span>
                        <strong class="admin-stat-value"><?php echo (int) $stats['total']; ?></strong>
                    </article>
                </div>
                <div class="col-md-4">
                    <article class="admin-stat-card">
                        <span class="admin-stat-label">Publicadas</span>
                        <strong class="admin-stat-value"><?php echo (int) $stats['published']; ?></strong>
                    </article>
                </div>
                <div class="col-md-4">
                    <article class="admin-stat-card">
                        <span class="admin-stat-label">Ultima actualizacion</span>
                        <strong class="admin-stat-value admin-stat-value-small"><?php echo admin_html(admin_format_datetime($stats['last_updated'])); ?></strong>
                    </article>
                </div>
            </section>

            <section class="row g-4 align-items-start">
                <div class="col-xl-5">
                    <div class="admin-panel sticky-xl-top admin-form-panel">
                        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                            <div>
                                <h2 class="admin-section-title mb-1"><?php echo $formValues['existing_id'] !== '' ? 'Editar vacante' : 'Nueva vacante'; ?></h2>
                                <p class="admin-copy mb-0">Completa la informacion principal. Las vacantes en borrador no se mostraran en la web.</p>
                            </div>
                            <?php if ($formValues['existing_id'] !== ''): ?>
                                <a class="btn btn-outline-secondary btn-sm" href="index.php">Nueva vacante</a>
                            <?php endif; ?>
                        </div>

                        <?php if (!empty($formErrors['general'])): ?>
                            <div class="alert alert-danger" role="alert">
                                <?php echo admin_html((string) $formErrors['general']); ?>
                            </div>
                        <?php endif; ?>

                        <form action="index.php<?php echo $formValues['existing_id'] !== '' ? '?edit=' . rawurlencode((string) $formValues['existing_id']) : ''; ?>" method="POST" class="row g-3">
                            <input type="hidden" name="csrf_token" value="<?php echo admin_html($csrfToken); ?>">
                            <input type="hidden" name="action" value="save_vacancy">
                            <input type="hidden" name="existing_id" value="<?php echo admin_html((string) $formValues['existing_id']); ?>">

                            <div class="col-12">
                                <label class="form-label" for="vacancyTitle">Titulo</label>
                                <input class="form-control <?php echo isset($formErrors['title']) ? 'is-invalid' : ''; ?>" type="text" id="vacancyTitle" name="title" maxlength="120" value="<?php echo admin_html((string) $formValues['title']); ?>" required>
                                <?php if (isset($formErrors['title'])): ?><div class="invalid-feedback"><?php echo admin_html((string) $formErrors['title']); ?></div><?php endif; ?>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label" for="vacancyArea">Area</label>
                                <input class="form-control <?php echo isset($formErrors['area']) ? 'is-invalid' : ''; ?>" type="text" id="vacancyArea" name="area" maxlength="60" value="<?php echo admin_html((string) $formValues['area']); ?>" required>
                                <?php if (isset($formErrors['area'])): ?><div class="invalid-feedback"><?php echo admin_html((string) $formErrors['area']); ?></div><?php endif; ?>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label" for="vacancyMode">Modalidad</label>
                                <input class="form-control <?php echo isset($formErrors['mode']) ? 'is-invalid' : ''; ?>" type="text" id="vacancyMode" name="mode" maxlength="60" value="<?php echo admin_html((string) $formValues['mode']); ?>" required>
                                <?php if (isset($formErrors['mode'])): ?><div class="invalid-feedback"><?php echo admin_html((string) $formErrors['mode']); ?></div><?php endif; ?>
                            </div>

                            <div class="col-md-7">
                                <label class="form-label" for="vacancyLocation">Ubicacion</label>
                                <input class="form-control <?php echo isset($formErrors['location']) ? 'is-invalid' : ''; ?>" type="text" id="vacancyLocation" name="location" maxlength="120" value="<?php echo admin_html((string) $formValues['location']); ?>" required>
                                <?php if (isset($formErrors['location'])): ?><div class="invalid-feedback"><?php echo admin_html((string) $formErrors['location']); ?></div><?php endif; ?>
                            </div>

                            <div class="col-md-5">
                                <label class="form-label" for="vacancySchedule">Jornada</label>
                                <input class="form-control <?php echo isset($formErrors['schedule']) ? 'is-invalid' : ''; ?>" type="text" id="vacancySchedule" name="schedule" maxlength="120" value="<?php echo admin_html((string) $formValues['schedule']); ?>" required>
                                <?php if (isset($formErrors['schedule'])): ?><div class="invalid-feedback"><?php echo admin_html((string) $formErrors['schedule']); ?></div><?php endif; ?>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label" for="vacancyStatus">Estado</label>
                                <select class="form-select" id="vacancyStatus" name="status">
                                    <option value="published" <?php echo (string) $formValues['status'] === 'published' ? 'selected' : ''; ?>>Publicada</option>
                                    <option value="draft" <?php echo (string) $formValues['status'] === 'draft' ? 'selected' : ''; ?>>Borrador</option>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label" for="vacancySortOrder">Orden</label>
                                <input class="form-control" type="number" id="vacancySortOrder" name="sort_order" min="0" max="9999" value="<?php echo admin_html((string) $formValues['sort_order']); ?>">
                            </div>

                            <div class="col-12">
                                <label class="form-label" for="vacancySummary">Resumen</label>
                                <textarea class="form-control <?php echo isset($formErrors['summary']) ? 'is-invalid' : ''; ?>" id="vacancySummary" name="summary" rows="4" maxlength="420" required><?php echo admin_html((string) $formValues['summary']); ?></textarea>
                                <?php if (isset($formErrors['summary'])): ?><div class="invalid-feedback"><?php echo admin_html((string) $formErrors['summary']); ?></div><?php endif; ?>
                            </div>

                            <div class="col-12">
                                <label class="form-label" for="vacancyPoints">Responsabilidades o puntos clave</label>
                                <textarea class="form-control <?php echo isset($formErrors['points_text']) ? 'is-invalid' : ''; ?>" id="vacancyPoints" name="points_text" rows="6" placeholder="Una linea por punto" required><?php echo admin_html((string) $formValues['points_text']); ?></textarea>
                                <?php if (isset($formErrors['points_text'])): ?><div class="invalid-feedback"><?php echo admin_html((string) $formErrors['points_text']); ?></div><?php endif; ?>
                            </div>

                            <div class="col-12 d-flex gap-2 flex-wrap">
                                <button class="btn btn-admin-primary" type="submit"><?php echo $formValues['existing_id'] !== '' ? 'Guardar cambios' : 'Crear vacante'; ?></button>
                                <a class="btn btn-outline-secondary" href="../careers/" target="_blank" rel="noopener noreferrer">Ver sitio publico</a>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="col-xl-7">
                    <div class="admin-panel">
                        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                            <div>
                                <h2 class="admin-section-title mb-1">Vacantes cargadas</h2>
                                <p class="admin-copy mb-0">Este listado es el origen oficial de la seccion de carreras.</p>
                            </div>
                            <span class="badge bg-dark"><?php echo (int) count($vacancies); ?> registros</span>
                        </div>

                        <?php if (empty($vacancies)): ?>
                            <div class="admin-empty-state">
                                <h3>No hay vacantes registradas</h3>
                                <p class="mb-0">Crea tu primera vacante para publicarla en la bolsa de trabajo.</p>
                            </div>
                        <?php else: ?>
                            <div class="admin-vacancy-grid">
                                <?php foreach ($vacancies as $vacancy): ?>
                                    <article class="admin-vacancy-card">
                                        <div class="admin-vacancy-head">
                                            <div>
                                                <span class="badge <?php echo admin_status_badge_class((string) ($vacancy['status'] ?? 'draft')); ?>"><?php echo admin_html(admin_status_label((string) ($vacancy['status'] ?? 'draft'))); ?></span>
                                                <h3 class="admin-vacancy-title"><?php echo admin_html((string) ($vacancy['title'] ?? 'Sin titulo')); ?></h3>
                                            </div>
                                            <div class="admin-vacancy-actions">
                                                <a class="btn btn-sm btn-outline-primary" href="index.php?edit=<?php echo rawurlencode((string) ($vacancy['id'] ?? '')); ?>">Editar</a>
                                                <form action="index.php" method="POST" onsubmit="return confirm('Se eliminara esta vacante. Deseas continuar?');">
                                                    <input type="hidden" name="csrf_token" value="<?php echo admin_html($csrfToken); ?>">
                                                    <input type="hidden" name="action" value="delete_vacancy">
                                                    <input type="hidden" name="vacancy_id" value="<?php echo admin_html((string) ($vacancy['id'] ?? '')); ?>">
                                                    <button class="btn btn-sm btn-outline-danger" type="submit">Eliminar</button>
                                                </form>
                                            </div>
                                        </div>

                                        <div class="admin-vacancy-meta">
                                            <span><i class="bi bi-briefcase"></i><?php echo admin_html((string) ($vacancy['area'] ?? '')); ?></span>
                                            <span><i class="bi bi-compass"></i><?php echo admin_html((string) ($vacancy['mode'] ?? '')); ?></span>
                                            <span><i class="bi bi-geo-alt"></i><?php echo admin_html((string) ($vacancy['location'] ?? '')); ?></span>
                                            <span><i class="bi bi-clock"></i><?php echo admin_html((string) ($vacancy['schedule'] ?? '')); ?></span>
                                        </div>

                                        <p class="admin-vacancy-summary"><?php echo admin_html((string) ($vacancy['summary'] ?? '')); ?></p>

                                        <?php if (!empty($vacancy['points']) && is_array($vacancy['points'])): ?>
                                            <ul class="admin-vacancy-points">
                                                <?php foreach ($vacancy['points'] as $point): ?>
                                                    <li><?php echo admin_html((string) $point); ?></li>
                                                <?php endforeach; ?>
                                            </ul>
                                        <?php endif; ?>

                                        <div class="admin-vacancy-foot">
                                            <span>ID: <code><?php echo admin_html((string) ($vacancy['id'] ?? '')); ?></code></span>
                                            <span>Actualizada: <?php echo admin_html(admin_format_datetime((string) ($vacancy['updated_at'] ?? ''))); ?></span>
                                        </div>
                                    </article>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </section>
        <?php endif; ?>
    </main>
</body>
</html>
