window.I18N_PAGE_TRANSLATIONS = {
  ...(window.I18N_PAGE_TRANSLATIONS || {}),
  es: {
    blogPage: {
      meta: {
        title: "Blog, Noticias y Comunicados - Servicios Logísticos Alsera"
      },
      hero: {
        title_accent: "Blog, Noticias y",
        title_main: "comunicados",
        description: "Un espacio oficial para compartir comunicados institucionales, novedades operativas sobre cadena de frío y artículos de análisis logístico farma.",
        primary_cta: "Ver Comunicados y Noticias",
        secondary_cta: "Contáctanos",
        image_alt: "Noticias y actualizaciones SELOASA"
      },
      filters: {
        all: "Todos",
        comunicados: "Comunicados Oficiales",
        noticias: "Noticias Operativas",
        blog: "Blog Farma"
      },
      search_placeholder: "Buscar por palabra clave o tema...",
      no_results_title: "No se encontraron publicaciones",
      no_results_desc: "Prueba con otra palabra clave o selecciona otra categoría en los filtros.",
      read_more: "Leer más",
      read_full: "Leer publicación completa",
      modal_contact: "Contactar sobre este tema",
      modal_close: "Cerrar",
      featured: {
        kicker: "Comunicado Oficial Destacado",
        category: "Comunicado Oficial",
        badge_class: "badge-pill-comunicado",
        date: "Mayo 2026",
        dept: "Dirección General & Aseguramiento de Calidad",
        read_time: "3 min lectura",
        title: "Actualización de Protocolos de Seguridad y Cumplimiento Normativo COFEPRIS & GDP 2026",
        summary: "Informamos a nuestros clientes y socios comerciales sobre la actualización integral de los protocolos de control térmico, trazabilidad y blindaje en todas nuestras rutas activas.",
        content: `
          <p>En <strong>Servicios Logísticos Alsera S.A. de C.V. (SELOASA)</strong>, la salvaguarda de productos biológicos, medicamentos de alta especialidad e insumos para la salud representa nuestra máxima prioridad operativa.</p>
          <p>Con fecha de inicio en este ciclo 2026, nuestra organización ha concluido con éxito la homologación de nuevos estándares de aseguramiento de calidad, en estricto cumplimiento con los lineamientos emitidos por la <strong>COFEPRIS</strong> y las directrices internacionales de <strong>Buenas Prácticas de Distribución (GDP)</strong>:</p>
          <ul>
            <li><strong>Monitoreo de Cadena de Frío:</strong> Sensores con calibración certificada vigente en rangos de 2 °C a 8 °C y 15 °C a 25 °C con mapeo térmico por unidad.</li>
            <li><strong>Protocolos de Blindaje y Custodia:</strong> Monitoreo satelital GPS híbrido 24/7/365, sensores de apertura de puertas con alerta remota y coordinación con custodia armada según requerimientos de carga crítica.</li>
            <li><strong>Capacitación Continua del Personal:</strong> Certificación de operadores en buenas prácticas de manipulación, protocolos de contingencia y registro de evidencias digitales.</li>
          </ul>
          <p>Agradecemos la confianza continua de la industria farmacéutica nacional e internacional, reiterando nuestro compromiso de ofrecer un transporte y almacenaje seguro, puntual y trazable.</p>
        `,
        image: "img/patio_unidades_dia_banner.jpg",
        image_alt: "Actualización destacada de operación SELOASA"
      },
      latest: {
        kicker: "Publicaciones Recientes",
        title: "Comunicados, Noticias y Artículos",
        description: "Explora avisos formales, reportes de infraestructura y mejores prácticas logísticas con los filtros temáticos.",
        items: [
          {
            id: "comunicado-gdp-2026",
            type: "comunicado",
            category: "Comunicado Oficial",
            badge_class: "badge-pill-comunicado",
            date: "Mayo 2026",
            dept: "Dirección General & Calidad",
            read_time: "3 min",
            title: "Actualización de Protocolos de Seguridad y Cumplimiento Normativo COFEPRIS & GDP 2026",
            summary: "Informamos a clientes y aliados sobre la actualización de controles térmicos y trazabilidad en todas nuestras rutas activas.",
            content: `
              <p>Reafirmamos nuestro estándar de excelencia operativa actualizando los protocolos de trazabilidad y cadena de frío para toda nuestra flota vehicular en el territorio nacional.</p>
              <p>Entre los aspectos más destacados de este comunicado se encuentran:</p>
              <ul>
                <li>Inspección y recalibración de sensores de temperatura en todas las cajas frigoríficas.</li>
                <li>Fortalecimiento del sistema de gestión de calidad documental para inspecciones COFEPRIS.</li>
                <li>Actualización del plan de contingencia térmica ante paradas no programadas en carretera.</li>
              </ul>
              <p>Esta actualización asegura que cada embarque mantenga las condiciones óptimas desde el centro de distribución hasta el punto final de entrega en hospitales, almacenes o farmacias.</p>
            `,
            image: "img/patio_unidades_dia_banner.jpg",
            image_alt: "Protocolos de seguridad y cumplimiento normativo SELOASA"
          },
          {
            id: "noticia-telemetria",
            type: "noticia",
            category: "Noticia Operativa",
            badge_class: "badge-pill-noticia",
            date: "Abril 2026",
            dept: "Gerencia de Tráfico y Monitoreo",
            read_time: "2 min",
            title: "SELOASA expande su capacidad de monitoreo satelital con telemetría de doble sensor",
            summary: "Incorporamos sensores térmicos calibrados de última generación en nuestra flota para asegurar visibilidad en tiempo real de -20°C a +25°C.",
            content: `
              <p>Como parte de nuestro programa de modernización tecnológica continua, SELOASA ha incorporado módulos de telemetría de doble sensor en sus unidades dedicadas al transporte farma.</p>
              <p>Esta tecnología permite supervisar en tiempo real tanto la temperatura ambiente dentro de la caja como la temperatura de contacto en las estibas críticas, emitiendo alertas inmediatas ante variaciones de tan solo 0.5 °C.</p>
              <p>Nuestra central de monitoreo 24/7 recibe telemetría ininterrumpida, permitiendo acciones preventivas inmediatas y reportes gráficos en tiempo real disponibles para auditoría del cliente.</p>
            `,
            image: "img/trans_monitoreo.jpg",
            image_alt: "Monitoreo de transporte y trazabilidad satelital"
          },
          {
            id: "blog-cadena-frio",
            type: "blog",
            category: "Blog Farma",
            badge_class: "badge-pill-blog",
            date: "Marzo 2026",
            dept: "Aseguramiento de Calidad",
            read_time: "4 min",
            title: "Claves para garantizar la integridad de la cadena de frío (2°C a 8°C) en tránsito crítico",
            summary: "Buenas prácticas, gestión de contingencias y estándares internacionales para proteger medicamentos de alta sensibilidad biológica.",
            content: `
              <p>El traslado de medicamentos biológicos, vacunas y reactivos diagnósticos exige una disciplina operativa implacable. En el rango de 2 °C a 8 °C, una excursión térmica puede degradar la eficacia de los principios activos y poner en riesgo vidas humanas.</p>
              <p>En este artículo analizamos los tres factores indispensables en una operación de alto nivel:</p>
              <ol>
                <li><strong>Pre-enfriamiento y estabilización:</strong> La unidad debe alcanzar y estabilizar la temperatura antes de la carga, evitando choque térmico con el producto.</li>
                <li><strong>Circulación homogénea del flujo de aire:</strong> La estiba debe respetar los ductos de retorno para evitar puntos calientes o sobreenfriamiento en zonas cercanas al evaporador.</li>
                <li><strong>Evidencias continuas sin desfase:</strong> Los data-loggers deben contrastarse con los registros satelitales en tiempo real para generar certidumbre legal y regulatoria.</li>
              </ol>
              <p>En SELOASA diseñamos cada ruta con redundancia tecnológica para que la cadena de frío jamás se interrumpa.</p>
            `,
            image: "img/alm_especializado.jpg",
            image_alt: "Operación de almacenaje y cadena de frío especializada"
          },
          {
            id: "comunicado-contingencias",
            type: "comunicado",
            category: "Comunicado Oficial",
            badge_class: "badge-pill-comunicado",
            date: "Marzo 2026",
            dept: "Comité de Seguridad y Prevención",
            read_time: "3 min",
            title: "Aviso a clientes: Plan de contingencia y mitigación operativa en temporada de lluvias",
            summary: "Activación del protocolo preventivo de rutas alternas y resguardo seguro para proteger entregas y tiempos de compromiso a nivel nacional.",
            content: `
              <p>Estimados clientes y socios estratégicos:</p>
              <p>Ante la proximidad de fenómenos climáticos y temporada de precipitaciones pluviales intensas en las regiones centro, sur y golfo del país, SELOASA ha activado formalmente su <strong>Protocolo Preventivo de Rutas Alternas y Mitigación de Riesgos</strong>.</p>
              <p>Dicho protocolo contempla:</p>
              <ul>
                <li>Revisión preventiva de neumáticos, sistemas de frenado ABS y hermetismo de cajas secas y refrigeradas.</li>
                <li>Asignación de unidades de respaldo en corredores logísticos estratégicos (Lerma, CDMX, Bajío y Guadalajara).</li>
                <li>Monitoreo meteorológico en tiempo real para reordenamiento preventivo de horarios de salida y cruce de tramos de alta susceptibilidad.</li>
              </ul>
              <p>Nuestros ejecutivos de cuenta mantendrán comunicación directa y oportuna ante cualquier eventualidad.</p>
            `,
            image: "img/cover-seguridad.jpg",
            image_alt: "Protocolo preventivo de seguridad y contingencias"
          },
          {
            id: "noticia-camaras",
            type: "noticia",
            category: "Noticia Operativa",
            badge_class: "badge-pill-noticia",
            date: "Febrero 2026",
            dept: "Desarrollo y Alianzas Estratégicas",
            read_time: "2 min",
            title: "Consolidación de alianzas estratégicas con cámaras frigoríficas multitemperatura",
            summary: "Ampliamos nuestra red de aliados certificados para brindar mayor capacidad de cross-docking y resguardo temporal en puntos clave del país.",
            content: `
              <p>SELOASA fortalece su infraestructura logística mediante acuerdos estratégicos con almacenes y cámaras refrigeradas con licencia sanitaria COFEPRIS en las principales zonas industriales del país.</p>
              <p>Esta integración permite a nuestros clientes disponer de:</p>
              <ul>
                <li>Capacidades de cross-docking ágil con temperatura controlada permanente.</li>
                <li>Almacenamiento temporal para contingencias o consolidación de pedidos de distribución capilar.</li>
                <li>Inspección documental y control de lotes con trazabilidad compartida.</li>
              </ul>
              <p>Continuamos consolidando la red logística farmacéutica más confiable y articulada de México.</p>
            `,
            image: "img/alm_refrigerado.jpg",
            image_alt: "Cámaras frigoríficas y almacenaje multitemperatura"
          },
          {
            id: "blog-trazabilidad",
            type: "blog",
            category: "Blog Farma",
            badge_class: "badge-pill-blog",
            date: "Enero 2026",
            dept: "Validación y Buenas Prácticas",
            read_time: "4 min",
            title: "Trazabilidad farmacéutica integral: El impacto del registro continuo en la auditoría de calidad",
            summary: "Análisis sobre la importancia del control de datos inalterables y generación de reportes inmediatos para auditorías sanitarias y COFEPRIS.",
            content: `
              <p>En el sector salud, la frase «lo que no está registrado no existe» es una máxima que define el éxito o fracaso en una auditoría regulatoria. La trazabilidad ya no consiste en revisar hojas de ruta al final del día, sino en disponer de un ecosistema digital blindado.</p>
              <p>Factores clave analizados en este artículo:</p>
              <ul>
                <li><strong>Integridad de datos (Data Integrity):</strong> Garantizar que las lecturas térmicas y bitácoras de viaje sean inalterables y con marca de tiempo precisa.</li>
                <li><strong>Respuesta inmediata en auditorías:</strong> Reducción del tiempo de entrega de evidencias de días a minutos ante cualquier solicitud de la autoridad sanitaria.</li>
                <li><strong>Visibilidad colaborativa:</strong> Compartir con el cliente tableros donde pueda consultar el estatus en vivo y descargar la gráfica de temperatura del viaje.</li>
              </ul>
              <p>En SELOASA transformamos la exigencia normativa en una ventaja competitiva para nuestros socios de negocio.</p>
            `,
            image: "img/sgc.webp",
            image_alt: "Sistema de gestión de calidad y trazabilidad"
          }
        ]
      },
      cta: {
        kicker: "Mantente al tanto",
        title: "Conversemos sobre actualizaciones, capacidades y novedades relevantes para tu operación",
        description: "Si quieres más información sobre un comunicado o una capacidad específica, estamos listos para atenderte.",
        button: "Ir a contacto"
      }
    }
  },
  en: {
    blogPage: {
      meta: {
        title: "Blog, News & Announcements - Servicios Logísticos Alsera"
      },
      hero: {
        title_accent: "Blog, News &",
        title_main: "announcements",
        description: "An official information hub for institutional announcements, operational cold-chain updates, and specialized pharma logistics articles.",
        primary_cta: "View Announcements & News",
        secondary_cta: "Contact Us",
        image_alt: "SELOASA news and updates"
      },
      filters: {
        all: "All",
        comunicados: "Official Announcements",
        noticias: "Operations News",
        blog: "Pharma Blog"
      },
      search_placeholder: "Search by keyword or topic...",
      no_results_title: "No posts found",
      no_results_desc: "Try another keyword or select a different category filter.",
      read_more: "Read more",
      read_full: "Read full post",
      modal_contact: "Contact us about this topic",
      modal_close: "Close",
      featured: {
        kicker: "Featured Official Announcement",
        category: "Official Announcement",
        badge_class: "badge-pill-comunicado",
        date: "May 2026",
        dept: "Executive Direction & Quality Assurance",
        read_time: "3 min read",
        title: "Update on Security Protocols and COFEPRIS & GDP 2026 Regulatory Compliance",
        summary: "SELOASA announces the comprehensive update of thermal control, GPS tracking, and armored security protocols across all active domestic routes.",
        content: `
          <p>At <strong>Servicios Logísticos Alsera S.A. de C.V. (SELOASA)</strong>, safeguarding biological products, specialized medicines, and healthcare supplies is our primary operational commitment.</p>
          <p>For the 2026 operational period, we have successfully implemented enhanced regulatory and technological standards aligned with <strong>COFEPRIS</strong> regulations and international <strong>Good Distribution Practices (GDP)</strong>:</p>
          <ul>
            <li><strong>Continuous Cold Chain Monitoring:</strong> Certified sensors calibrated for 2°C to 8°C and 15°C to 25°C ranges with thermal mapping.</li>
            <li><strong>Security and Escort Protocols:</strong> 24/7/365 hybrid GPS tracking, door-opening alerts, and coordinated armed escorts for high-value cargo.</li>
            <li><strong>Ongoing Personnel Certification:</strong> Specialized training in GDP handling, contingency protocols, and digital evidence capture.</li>
          </ul>
        `,
        image: "img/patio_unidades_dia_banner.jpg",
        image_alt: "Featured operations update from SELOASA"
      },
      latest: {
        kicker: "Recent Publications",
        title: "Announcements, News & Articles",
        description: "Explore formal statements, infrastructure updates, and logistics best practices using category filters.",
        items: [
          {
            id: "comunicado-gdp-2026",
            type: "comunicado",
            category: "Official Announcement",
            badge_class: "badge-pill-comunicado",
            date: "May 2026",
            dept: "Executive Direction & Quality",
            read_time: "3 min",
            title: "Update on Security Protocols and COFEPRIS & GDP 2026 Regulatory Compliance",
            summary: "We inform clients and partners about enhanced thermal monitoring and traceability across all our active routes.",
            content: `
              <p>We reinforce operational excellence by updating traceability and cold-chain protocols across our entire fleet in Mexico.</p>
              <ul>
                <li>Recalibration of temperature sensors in all refrigerated units.</li>
                <li>Reinforced document quality management for sanitary audits.</li>
                <li>Thermal contingency plan updates for road transit.</li>
              </ul>
            `,
            image: "img/patio_unidades_dia_banner.jpg",
            image_alt: "SELOASA security and compliance protocols"
          },
          {
            id: "noticia-telemetria",
            type: "noticia",
            category: "Operations News",
            badge_class: "badge-pill-noticia",
            date: "April 2026",
            dept: "Traffic & Monitoring Management",
            read_time: "2 min",
            title: "SELOASA expands satellite monitoring capabilities with dual-sensor telemetry",
            summary: "We integrate next-generation calibrated thermal sensors into our fleet to guarantee real-time visibility from -20°C to +25°C.",
            content: `
              <p>As part of our continuous technology roadmap, SELOASA has implemented dual-sensor telemetry modules across dedicated pharma units, providing instant alerts for variations as low as 0.5 °C.</p>
            `,
            image: "img/trans_monitoreo.jpg",
            image_alt: "Satellite transport monitoring"
          },
          {
            id: "blog-cadena-frio",
            type: "blog",
            category: "Pharma Blog",
            badge_class: "badge-pill-blog",
            date: "March 2026",
            dept: "Quality Assurance",
            read_time: "4 min",
            title: "Key factors to ensure cold-chain integrity (2°C to 8°C) during critical transit",
            summary: "Best practices, contingency management, and international standards for safeguarding temperature-sensitive medicines.",
            content: `
              <p>Transporting biological medicines requires strict operational rigor. Between 2°C and 8°C, thermal deviations can compromise therapeutic value. We discuss pre-cooling, airflow circulation, and uninterrupted data logs.</p>
            `,
            image: "img/alm_especializado.jpg",
            image_alt: "Specialized cold chain storage operation"
          },
          {
            id: "comunicado-contingencias",
            type: "comunicado",
            category: "Official Announcement",
            badge_class: "badge-pill-comunicado",
            date: "March 2026",
            dept: "Security & Prevention Committee",
            read_time: "3 min",
            title: "Customer Advisory: Contingency Plan and Risk Mitigation for the Rainy Season",
            summary: "Activation of preventative alternate routes and secure storage protocol to protect delivery timelines nationwide.",
            content: `
              <p>SELOASA has activated its weather contingency plan, including preventative vehicle inspections, standby units on key corridors, and real-time route rerouting.</p>
            `,
            image: "img/cover-seguridad.jpg",
            image_alt: "Preventative security and contingency protocol"
          },
          {
            id: "noticia-camaras",
            type: "noticia",
            category: "Operations News",
            badge_class: "badge-pill-noticia",
            date: "February 2026",
            dept: "Development & Strategic Partnerships",
            read_time: "2 min",
            title: "Consolidation of strategic partnerships with multi-temperature cold storage facilities",
            summary: "Expanding our network of certified partners to provide agile cross-docking and temporary holding across Mexico.",
            content: `
              <p>SELOASA expands pharma cross-docking capacity with COFEPRIS-approved partners nationwide, ensuring seamless cold-chain handover.</p>
            `,
            image: "img/alm_refrigerado.jpg",
            image_alt: "Cold chambers and multi-temperature storage"
          },
          {
            id: "blog-trazabilidad",
            type: "blog",
            category: "Pharma Blog",
            badge_class: "badge-pill-blog",
            date: "January 2026",
            dept: "Validation & Best Practices",
            read_time: "4 min",
            title: "Comprehensive pharma traceability: The impact of continuous records on quality audits",
            summary: "Analysis of the importance of immutable data and immediate report generation for health authority audits.",
            content: `
              <p>In healthcare logistics, uninterrupted digital traceability ensures compliance with regulatory standards and builds lasting customer confidence.</p>
            `,
            image: "img/sgc.webp",
            image_alt: "Quality management system and traceability"
          }
        ]
      },
      cta: {
        kicker: "Stay informed",
        title: "Let's talk about updates, capabilities, and relevant news for your operation",
        description: "If you want more information about a specific update or capability, we are ready to assist you.",
        button: "Go to contact"
      }
    }
  },
  al: {
    blogPage: {
      meta: {
        title: "Blog, Neuigkeiten & Mitteilungen - Servicios Logísticos Alsera"
      },
      hero: {
        title_accent: "Blog, Neuigkeiten &",
        title_main: "Mitteilungen",
        description: "Offizieller Informationsbereich für behördliche Bekanntmachungen, operative Kühlketten-Updates und pharmazeutische Fachartikel.",
        primary_cta: "Mitteilungen & News ansehen",
        secondary_cta: "Kontaktieren Sie uns",
        image_alt: "Neuigkeiten und Updates von SELOASA"
      },
      filters: {
        all: "Alle",
        comunicados: "Offizielle Mitteilungen",
        noticias: "Operative Nachrichten",
        blog: "Pharma-Blog"
      },
      search_placeholder: "Nach Stichwort oder Thema suchen...",
      no_results_title: "Keine Veröffentlichungen gefunden",
      no_results_desc: "Versuchen Sie einen anderen Suchbegriff oder wählen Sie eine andere Kategorie.",
      read_more: "Weiterlesen",
      read_full: "Vollständigen Beitrag lesen",
      modal_contact: "Kontakt zu diesem Thema",
      modal_close: "Schließen",
      featured: {
        kicker: "Aktuelle offizielle Mitteilung",
        category: "Offizielle Mitteilung",
        badge_class: "badge-pill-comunicado",
        date: "Mai 2026",
        dept: "Geschäftsleitung & Qualitätssicherung",
        read_time: "3 Min. Lesezeit",
        title: "Aktualisierung der Sicherheitsprotokolle und COFEPRIS- & GDP-Compliance 2026",
        summary: "SELOASA gibt die umfassende Aktualisierung von Temperaturkontrollen, GPS-Tracking und Sicherheitsmaßnahmen auf allen nationalen Routen bekannt.",
        content: `
          <p>Bei <strong>SELOASA</strong> steht die Integrität pharmazeutischer Güter und eine lückenlose Kühlkette an oberster Stelle. 2026 haben wir unsere Protokolle gemäß <strong>COFEPRIS</strong> und internationalen <strong>Good Distribution Practices (GDP)</strong> weiter ausgebaut.</p>
        `,
        image: "img/patio_unidades_dia_banner.jpg",
        image_alt: "Hervorgehobenes Betriebsupdate von SELOASA"
      },
      latest: {
        kicker: "Neueste Veröffentlichungen",
        title: "Mitteilungen, Nachrichten & Artikel",
        description: "Entdecken Sie offizielle Mitteilungen, Infrastrukturberichte und bewährte Logistikpraktiken.",
        items: [
          {
            id: "comunicado-gdp-2026",
            type: "comunicado",
            category: "Offizielle Mitteilung",
            badge_class: "badge-pill-comunicado",
            date: "Mai 2026",
            dept: "Geschäftsleitung & Qualität",
            read_time: "3 Min.",
            title: "Aktualisierung der Sicherheitsprotokolle und COFEPRIS- & GDP-Compliance 2026",
            summary: "Wir informieren Kunden und Partner über verstärkte Temperaturüberwachung auf allen Routen.",
            content: "<p>Vollständige Überprüfung aller Sensoren und Dokumentationsprozesse zur Gewährleistung maximaler Compliance.</p>",
            image: "img/patio_unidades_dia_banner.jpg",
            image_alt: "Sicherheitsprotokolle von SELOASA"
          },
          {
            id: "noticia-telemetria",
            type: "noticia",
            category: "Operative Nachricht",
            badge_class: "badge-pill-noticia",
            date: "April 2026",
            dept: "Flottenmanagement & Monitoring",
            read_time: "2 Min.",
            title: "SELOASA erweitert Satellitenüberwachung mit Dual-Sensor-Telemetrie",
            summary: "Integration modernster kalibrierter Sensoren zur Gewährleistung von Echtzeit-Transparenz von -20°C bis +25°C.",
            content: "<p>Präzise Sensorik und sofortige Warnmeldungen bei Temperaturabweichungen von nur 0,5 °C.</p>",
            image: "img/trans_monitoreo.jpg",
            image_alt: "Transportüberwachung und Telemetrie"
          },
          {
            id: "blog-cadena-frio",
            type: "blog",
            category: "Pharma-Blog",
            badge_class: "badge-pill-blog",
            date: "März 2026",
            dept: "Qualitätssicherung",
            read_time: "4 Min.",
            title: "Schlüsselfaktoren zur Sicherung der Kühlkette (2°C bis 8°C) bei kritischen Transporten",
            summary: "Best Practices, Notfallmanagement und globale Standards zum Schutz hochsensibler Medikamente.",
            content: "<p>Vorkühlung, homogene Luftzirkulation und digitale Datenprotokolle im Fokus.</p>",
            image: "img/alm_especializado.jpg",
            image_alt: "Spezialisierter Kühlkettenbetrieb"
          },
          {
            id: "comunicado-contingencias",
            type: "comunicado",
            category: "Offizielle Mitteilung",
            badge_class: "badge-pill-comunicado",
            date: "März 2026",
            dept: "Sicherheits- & Präventionsausschuss",
            read_time: "3 Min.",
            title: "Kundenhinweis: Notfall- und Risikominderungsplan für die Regenzeit",
            summary: "Aktivierung präventiver Ausweichrouten zur Sicherstellung pünktlicher Lieferungen bundesweit.",
            content: "<p>Präventive Maßnahmen zur Gewährleistung von Termintreue und Frachtsicherheit bei Schlechtwetterlagen.</p>",
            image: "img/cover-seguridad.jpg",
            image_alt: "Sicherheitsprotokoll und Notfallplan"
          },
          {
            id: "noticia-camaras",
            type: "noticia",
            category: "Operative Nachricht",
            badge_class: "badge-pill-noticia",
            date: "Februar 2026",
            dept: "Strategische Partnerschaften",
            read_time: "2 Min.",
            title: "Ausbau strategischer Partnerschaften mit Mehrtemperatur-Kühlhäusern",
            summary: "Erweiterung unseres Netzwerks zertifizierter Partner für agiles Cross-Docking in ganz Mexiko.",
            content: "<p>Mehr Kapazität und Flexibilität für temperaturgeführte Frachten an Schlüsselstandorten.</p>",
            image: "img/alm_refrigerado.jpg",
            image_alt: "Kühlhäuser und Mehrtemperaturlager"
          },
          {
            id: "blog-trazabilidad",
            type: "blog",
            category: "Pharma-Blog",
            badge_class: "badge-pill-blog",
            date: "Januar 2026",
            dept: "Validierung & Standards",
            read_time: "4 Min.",
            title: "Ganzheitliche pharmazeutische Rückverfolgbarkeit: Die Bedeutung lückenloser Aufzeichnungen",
            summary: "Analyse unveränderlicher Datenprotokolle und sofortiger Auditberichte für Behörden.",
            content: "<p>Wie digitale Datenintegrität bei Qualitätsaudits Zeit spart und Rechtssicherheit schafft.</p>",
            image: "img/sgc.webp",
            image_alt: "Qualitätsmanagementsystem"
          }
        ]
      },
      cta: {
        kicker: "Informiert bleiben",
        title: "Lassen Sie uns über Updates, Kapazitäten und relevante Neuigkeiten sprechen",
        description: "Wenn Sie mehr Informationen wünschen, helfen wir Ihnen gerne weiter.",
        button: "Zur Kontaktseite"
      }
    }
  },
  pt: {
    blogPage: {
      meta: {
        title: "Blog, Notícias e Comunicados - Servicios Logísticos Alsera"
      },
      hero: {
        title_accent: "Blog, Notícias e",
        title_main: "comunicados",
        description: "Um espaço oficial para compartilhar comunicados institucionais, novidades operacionais sobre cadeia fria e artigos especializados em logística farmacêutica.",
        primary_cta: "Ver Comunicados e Notícias",
        secondary_cta: "Fale Conosco",
        image_alt: "Notícias e atualizações da SELOASA"
      },
      filters: {
        all: "Todos",
        comunicados: "Comunicados Oficiais",
        noticias: "Notícias Operacionais",
        blog: "Blog Farma"
      },
      search_placeholder: "Buscar por palavra-chave ou tema...",
      no_results_title: "Nenhuma publicação encontrada",
      no_results_desc: "Tente outra palavra-chave ou escolha outra categoria nos filtros.",
      read_more: "Ler mais",
      read_full: "Ler publicação completa",
      modal_contact: "Falar sobre este tema",
      modal_close: "Fechar",
      featured: {
        kicker: "Comunicado Oficial em Destaque",
        category: "Comunicado Oficial",
        badge_class: "badge-pill-comunicado",
        date: "Maio de 2026",
        dept: "Diretoria Geral & Garantia da Qualidade",
        read_time: "3 min de leitura",
        title: "Atualização de Protocolos de Segurança e Conformidade Regulatória COFEPRIS & GDP 2026",
        summary: "A SELOASA anuncia a atualização completa dos controles térmicos, rastreamento via satélite e segurança em todas as suas rotas ativas no México.",
        content: `
          <p>Na <strong>SELOASA</strong>, a integridade de produtos biológicos e medicamentos é a nossa prioridade. Para o ciclo de 2026, atualizamos nossos padrões em conformidade com as diretrizes da <strong>COFEPRIS</strong> e as <strong>Boas Práticas de Distribuição (GDP)</strong>.</p>
        `,
        image: "img/patio_unidades_dia_banner.jpg",
        image_alt: "Atualização operacional em destaque da SELOASA"
      },
      latest: {
        kicker: "Publicações Recentes",
        title: "Comunicados, Notícias e Artigos",
        description: "Explore comunicados formais, relatórios operacionais e boas práticas logísticas com os filtros por categoria.",
        items: [
          {
            id: "comunicado-gdp-2026",
            type: "comunicado",
            category: "Comunicado Oficial",
            badge_class: "badge-pill-comunicado",
            date: "Maio de 2026",
            dept: "Diretoria Geral & Qualidade",
            read_time: "3 min",
            title: "Atualização de Protocolos de Segurança e Conformidade Regulatória COFEPRIS & GDP 2026",
            summary: "Informamos clientes e parceiros sobre o reforço no controle térmico e rastreabilidade em todas as nossas rotas.",
            content: "<p>Recalibração certificada de sensores e aprimoramento contínuo dos registros de qualidade para auditorias.</p>",
            image: "img/patio_unidades_dia_banner.jpg",
            image_alt: "Protocolos de segurança e conformidade da SELOASA"
          },
          {
            id: "noticia-telemetria",
            type: "noticia",
            category: "Notícia Operacional",
            badge_class: "badge-pill-noticia",
            date: "Abril de 2026",
            dept: "Gestão de Tráfego e Monitoramento",
            read_time: "2 min",
            title: "SELOASA expande capacidade de monitoramento satelital com telemetria de sensor duplo",
            summary: "Incorporamos sensores térmicos calibrados de última geração em nossa frota para assegurar visibilidade de -20°C a +25°C.",
            content: "<p>Monitoramento 24/7 com alertas imediatos para oscilações térmicas a partir de 0,5 °C.</p>",
            image: "img/trans_monitoreo.jpg",
            image_alt: "Monitoramento de transporte e rastreabilidade"
          },
          {
            id: "blog-cadena-frio",
            type: "blog",
            category: "Blog Farma",
            badge_class: "badge-pill-blog",
            date: "Março de 2026",
            dept: "Garantia da Qualidade",
            read_time: "4 min",
            title: "Pontos-chave para assegurar a integridade da cadeia fria (2°C a 8°C) no trânsito crítico",
            summary: "Boas práticas, gestão de contingências e normas internacionais para proteger medicamentos sensíveis.",
            content: "<p>Pré-resfriamento, circulação de ar eficiente e relatórios digitais contínuos sem interrupções.</p>",
            image: "img/alm_especializado.jpg",
            image_alt: "Operação especializada em cadeia de frio"
          },
          {
            id: "comunicado-contingencias",
            type: "comunicado",
            category: "Comunicado Oficial",
            badge_class: "badge-pill-comunicado",
            date: "Março de 2026",
            dept: "Comitê de Segurança e Prevenção",
            read_time: "3 min",
            title: "Aviso a clientes: Plano de contingência e mitigação de riscos no período de chuvas",
            summary: "Ativação de rotas alternativas preventivas para garantir pontualidade e segurança nas entregas nacionais.",
            content: "<p>Inspeção veicular preventiva e suporte em corredores logísticos estratégicos.</p>",
            image: "img/cover-seguridad.jpg",
            image_alt: "Protocolo preventivo de segurança e contingências"
          },
          {
            id: "noticia-camaras",
            type: "noticia",
            category: "Notícia Operacional",
            badge_class: "badge-pill-noticia",
            date: "Fevereiro de 2026",
            dept: "Parcerias Estratégicas",
            read_time: "2 min",
            title: "Consolidação de parcerias com câmaras frigoríficas multitemperatura",
            summary: "Ampliamos nossa rede de parceiros certificados para operações ágeis de cross-docking em todo o México.",
            content: "<p>Maior capacidade de transbordo e armazenagem temporária com controle térmico contínuo.</p>",
            image: "img/alm_refrigerado.jpg",
            image_alt: "Câmaras frias e armazenagem multitemperatura"
          },
          {
            id: "blog-trazabilidad",
            type: "blog",
            category: "Blog Farma",
            badge_class: "badge-pill-blog",
            date: "Janeiro de 2026",
            dept: "Validação e Padrões",
            read_time: "4 min",
            title: "Rastreabilidade farmacêutica integral: O impacto do registro contínuo na auditoria de qualidade",
            summary: "Análise sobre a importância de dados invioláveis e relatórios imediatos para auditorias sanitárias.",
            content: "<p>Como a integridade de dados reduz o tempo de resposta em auditorias e fortalece a confiança dos clientes.</p>",
            image: "img/sgc.webp",
            image_alt: "Sistema de gestão da qualidade"
          }
        ]
      },
      cta: {
        kicker: "Mantenha-se informado",
        title: "Vamos conversar sobre atualizações, capacidades e novidades para sua operação",
        description: "Se precisar de mais detalhes sobre um comunicado ou capacidade, estamos prontos para atender você.",
        button: "Ir para contato"
      }
    }
  },
  fr: {
    blogPage: {
      meta: {
        title: "Blog, Actualités et Communiqués - Servicios Logísticos Alsera"
      },
      hero: {
        title_accent: "Blog, Actualités et",
        title_main: "communiqués",
        description: "Un espace officiel d'information pour partager les communiqués institutionnels, les nouveautés opérationnelles sur la chaîne du froid et les analyses logistiques pharmaceutiques.",
        primary_cta: "Voir les Communiqués & Actualités",
        secondary_cta: "Contactez-nous",
        image_alt: "Actualités et mises à jour de SELOASA"
      },
      filters: {
        all: "Tous",
        comunicados: "Communiqués Officiels",
        noticias: "Actualités Opérationnelles",
        blog: "Blog Pharma"
      },
      search_placeholder: "Rechercher par mot-clé ou sujet...",
      no_results_title: "Aucune publication trouvée",
      no_results_desc: "Essayez un autre mot-clé ou sélectionnez une autre catégorie.",
      read_more: "En savoir plus",
      read_full: "Lire la publication complète",
      modal_contact: "Échanger sur ce sujet",
      modal_close: "Fermer",
      featured: {
        kicker: "Communiqué Officiel à la Une",
        category: "Communiqué Officiel",
        badge_class: "badge-pill-comunicado",
        date: "Mai 2026",
        dept: "Direction Générale & Assurance Qualité",
        read_time: "3 min de lecture",
        title: "Mise à jour des protocoles de sécurité et conformité réglementaire COFEPRIS & GDP 2026",
        summary: "SELOASA annonce la mise à niveau complète de ses contrôles thermiques, de sa télémétrie GPS et de sa sécurité renforcée sur toutes ses routes au Mexique.",
        content: `
          <p>Chez <strong>SELOASA</strong>, la protection des produits pharmaceutiques et biologiques est au cœur de nos priorités. Pour le cycle 2026, nous avons renforcé nos procédures selon les normes de la <strong>COFEPRIS</strong> et les <strong>Bonnes Pratiques de Distribution (GDP)</strong>.</p>
        `,
        image: "img/patio_unidades_dia_banner.jpg",
        image_alt: "Mise à jour opérationnelle à la une de SELOASA"
      },
      latest: {
        kicker: "Publications Récentes",
        title: "Communiqués, Actualités et Articles",
        description: "Découvrez les déclarations officielles, les bilans opérationnels et les bonnes pratiques logistiques.",
        items: [
          {
            id: "comunicado-gdp-2026",
            type: "comunicado",
            category: "Communiqué Officiel",
            badge_class: "badge-pill-comunicado",
            date: "Mai 2026",
            dept: "Direction Générale & Qualité",
            read_time: "3 min",
            title: "Mise à jour des protocoles de sécurité et conformité réglementaire COFEPRIS & GDP 2026",
            summary: "Information aux clients et partenaires sur le renforcement du suivi thermique et de la traçabilité sur tous nos trajets.",
            content: "<p>Contrôles étalonnés rigoureux et traçabilité de bout en bout pour chaque expédition pharmaceutique.</p>",
            image: "img/patio_unidades_dia_banner.jpg",
            image_alt: "Protocoles de sécurité et conformité de SELOASA"
          },
          {
            id: "noticia-telemetria",
            type: "noticia",
            category: "Actualité Opérationnelle",
            badge_class: "badge-pill-noticia",
            date: "Avril 2026",
            dept: "Gestion du Trafic et Supervision",
            read_time: "2 min",
            title: "SELOASA renforce sa surveillance satellitaire avec une télémétrie à double capteur",
            summary: "Installation de sondes thermiques étalonnées de nouvelle génération pour un suivi en temps réel de -20°C à +25°C.",
            content: "<p>Surveillance 24/7 avec alertes automatiques en cas d'écart thermique dès 0,5 °C.</p>",
            image: "img/trans_monitoreo.jpg",
            image_alt: "Suivi du transport et traçabilité"
          },
          {
            id: "blog-cadena-frio",
            type: "blog",
            category: "Blog Pharma",
            badge_class: "badge-pill-blog",
            date: "Mars 2026",
            dept: "Assurance Qualité",
            read_time: "4 min",
            title: "Clés pour garantir l'intégrité de la chaîne du froid (2°C à 8°C) en transport critique",
            summary: "Bonnes pratiques, gestion des imprévus et normes internationales pour la sécurité des produits pharmaceutiques.",
            content: "<p>Pré-refroidissement des caisses, circulation d'air homogène et données de température infalsifiables.</p>",
            image: "img/alm_especializado.jpg",
            image_alt: "Opération spécialisée de la chaîne du froid"
          },
          {
            id: "comunicado-contingencias",
            type: "comunicado",
            category: "Communiqué Officiel",
            badge_class: "badge-pill-comunicado",
            date: "Mars 2026",
            dept: "Comité de Sécurité et Prévention",
            read_time: "3 min",
            title: "Avis aux clients : Plan d'urgence et atténuation des risques pour la saison des pluies",
            summary: "Mise en place d'itinéraires alternatifs préventifs pour sécuriser les livraisons partout au Mexique.",
            content: "<p>Inspections préventives de la flotte et cellules d'appui sur les axes logistiques majeurs.</p>",
            image: "img/cover-seguridad.jpg",
            image_alt: "Protocole préventif de sécurité et gestion des imprévus"
          },
          {
            id: "noticia-camaras",
            type: "noticia",
            category: "Actualité Opérationnelle",
            badge_class: "badge-pill-noticia",
            date: "Février 2026",
            dept: "Partenariats Stratégiques",
            read_time: "2 min",
            title: "Renforcement des partenariats stratégiques avec des entrepôts frigorifiques multi-températures",
            summary: "Extension de notre réseau certifié pour offrir des capacités de cross-docking réactives à travers le Mexique.",
            content: "<p>Plus de flexibilité pour le transit et le stockage tampon sous température strictement régulée.</p>",
            image: "img/alm_refrigerado.jpg",
            image_alt: "Chambres froides et stockage multi-température"
          },
          {
            id: "blog-trazabilidad",
            type: "blog",
            category: "Blog Pharma",
            badge_class: "badge-pill-blog",
            date: "Janvier 2026",
            dept: "Validation et Normes",
            read_time: "4 min",
            title: "Traçabilité pharmaceutique intégrale : L'impact de l'enregistrement continu sur les audits qualité",
            summary: "Analyse sur l'importance de données infalsifiables et de rapports instantanés lors d'audits sanitaires.",
            content: "<p>L'intégrité numérique des données comme gage de conformité et de sérénité pour les laboratoires.</p>",
            image: "img/sgc.webp",
            image_alt: "Système de gestion de la qualité"
          }
        ]
      },
      cta: {
        kicker: "Restez informé",
        title: "Échangeons sur les mises à jour, les capacités et les actualités pertinentes pour votre activité",
        description: "Si vous souhaitez plus d'informations sur un communiqué ou une capacité spécifique, nous sommes à votre écoute.",
        button: "Aller au contact"
      }
    }
  }
};
