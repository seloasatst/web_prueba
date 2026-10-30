<?php
/**
 * SELOASA - Mapa del Sitio Dinámico XML para Motores de Búsqueda
 * Genera el XML en tiempo real incorporando páginas corporativas, servicios
 * y artículos de blog actualizados automáticamente desde el storage.
 */

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600');

$baseUrl = 'https://seloasa.com.mx';

$staticPages = [
    [
        'loc' => '/',
        'priority' => '1.0',
        'changefreq' => 'daily',
        'lastmod' => '2026-10-29',
        'images' => [
            ['loc' => '/img/fotos%20unidades%202026/15.jpeg', 'title' => 'Flota Farmacéutica Multitemperatura SELOASA'],
            ['loc' => '/img/patio_unidades_dia_banner.jpg', 'title' => 'Patio de Maniobras y Unidades SELOASA']
        ]
    ],
    [
        'loc' => '/home/',
        'priority' => '1.0',
        'changefreq' => 'weekly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/about-us/',
        'priority' => '0.85',
        'changefreq' => 'monthly',
        'lastmod' => '2026-10-29',
        'images' => [
            ['loc' => '/img/feature.jpg', 'title' => 'Instalaciones y equipo humano SELOASA']
        ]
    ],
    [
        'loc' => '/services/',
        'priority' => '0.90',
        'changefreq' => 'weekly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/transport/',
        'priority' => '0.90',
        'changefreq' => 'weekly',
        'lastmod' => '2026-10-29',
        'images' => [
            ['loc' => '/img/fotos%20unidades%202026/14.jpeg', 'title' => 'Transporte Refrigerado y Congelado SELOASA']
        ]
    ],
    [
        'loc' => '/storage/',
        'priority' => '0.90',
        'changefreq' => 'weekly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/distribution/',
        'priority' => '0.90',
        'changefreq' => 'weekly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/paqueteria/',
        'priority' => '0.90',
        'changefreq' => 'weekly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/security/',
        'priority' => '0.80',
        'changefreq' => 'monthly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/blog/',
        'priority' => '0.95',
        'changefreq' => 'daily',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/contact/',
        'priority' => '0.85',
        'changefreq' => 'monthly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/quote/',
        'priority' => '0.85',
        'changefreq' => 'monthly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/standards/',
        'priority' => '0.80',
        'changefreq' => 'monthly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/environmental-responsibility/',
        'priority' => '0.80',
        'changefreq' => 'monthly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/human-rights/',
        'priority' => '0.70',
        'changefreq' => 'monthly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/privacy-notice/',
        'priority' => '0.60',
        'changefreq' => 'monthly',
        'lastmod' => '2026-10-29'
    ],
    [
        'loc' => '/sitemap.html',
        'priority' => '0.60',
        'changefreq' => 'weekly',
        'lastmod' => '2026-10-29'
    ]
];

// Cargar publicaciones dinámicas del blog
$storageFile = __DIR__ . '/php/storage/noticias.json';
$blogItems = [];
if (file_exists($storageFile)) {
    $content = @file_get_contents($storageFile);
    if ($content) {
        $json = @json_decode($content, true);
        if (isset($json['items']) && is_array($json['items'])) {
            foreach ($json['items'] as $item) {
                if (isset($item['status']) && $item['status'] === 'draft') continue;
                if (empty($item['id'])) continue;
                $blogItems[] = $item;
            }
        }
    }
}

// Fallback de artículos base si el storage no tiene registros
if (empty($blogItems)) {
    $blogItems = [
        ['id' => 'seloasa-reforestacion-futuro-sostenible-2026', 'title' => 'SELOASA: Comprometidos con un Futuro Sostenible', 'image' => 'img/patio_unidades_dia_banner.jpg', 'updated_at' => '2026-10-29'],
        ['id' => 'comunicado-gdp-2026', 'title' => 'Actualización de Protocolos de Seguridad y Cumplimiento Normativo COFEPRIS & GDP 2026', 'image' => 'img/patio_unidades_dia_banner.jpg', 'updated_at' => '2026-10-26'],
        ['id' => 'noticia-telemetria', 'title' => 'Ampliación de Flota Farma con Telemetría Activa y Monitoreo Térmico Continuo', 'image' => 'img/fotos unidades 2026/15.jpeg', 'updated_at' => '2026-10-26'],
        ['id' => 'blog-cadena-frio', 'title' => 'Buenas Prácticas para Evitar Desviaciones Térmicas en Logística de Medicamentos', 'image' => 'img/fotos unidades 2026/14.jpeg', 'updated_at' => '2026-10-26']
    ];
}

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
<?php foreach ($staticPages as $page): ?>
  <url>
    <loc><?= htmlspecialchars($baseUrl . $page['loc']) ?></loc>
    <lastmod><?= htmlspecialchars($page['lastmod']) ?></lastmod>
    <changefreq><?= htmlspecialchars($page['changefreq']) ?></changefreq>
    <priority><?= htmlspecialchars($page['priority']) ?></priority>
    <?php if (!empty($page['images'])): ?>
      <?php foreach ($page['images'] as $img): ?>
        <image:image>
          <image:loc><?= htmlspecialchars($baseUrl . '/' . ltrim($img['loc'], '/')) ?></image:loc>
          <image:title><?= htmlspecialchars($img['title']) ?></image:title>
        </image:image>
      <?php endforeach; ?>
    <?php endif; ?>
  </url>
<?php endforeach; ?>

<?php foreach ($blogItems as $item): 
    $lastmod = !empty($item['updated_at']) ? substr($item['updated_at'], 0, 10) : '2026-10-30';
    $postUrl = $baseUrl . '/blog/articulo.html?id=' . urlencode($item['id']);
?>
  <url>
    <loc><?= htmlspecialchars($postUrl) ?></loc>
    <lastmod><?= htmlspecialchars($lastmod) ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <?php if (!empty($item['image'])): ?>
      <image:image>
        <image:loc><?= htmlspecialchars($baseUrl . '/' . ltrim($item['image'], '/')) ?></image:loc>
        <image:title><?= htmlspecialchars($item['title'] ?? 'Publicación SELOASA') ?></image:title>
      </image:image>
    <?php endif; ?>
  </url>
<?php endforeach; ?>
</urlset>

