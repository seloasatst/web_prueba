window.I18N_PAGE_TRANSLATIONS = {
  ...(window.I18N_PAGE_TRANSLATIONS || {}),
  es: {
    careersPage: {
      meta: {
        title: "Bolsa de trabajo - Servicios Logísticos Alsera"
      },
      hero: {
        title_accent: "Bolsa de",
        title_main: "trabajo",
        description: "Conoce oportunidades para integrarte a SELOASA y da seguimiento a nuestras vacantes activas desde un solo lugar.",
        image_alt: "Equipo SELOASA"
      },
      overview: {
        kicker: "Talento SELOASA",
        title: "Construye tu siguiente etapa profesional con nosotros",
        description_1: "Buscamos personas que quieran crecer en una operación logística especializada, con enfoque en servicio, cumplimiento y mejora continua.",
        description_2: "En esta página podrás conocer las áreas donde solemos integrar talento, la forma de postularte y el canal oficial para revisar vacantes disponibles.",
        item_1: "Oportunidades vinculadas con almacenaje, transporte, distribución y soporte operativo.",
        item_2: "Procesos alineados con seguridad, calidad, trazabilidad y cumplimiento.",
        item_3: "Consulta de vacantes activas mediante nuestro canal oficial en Indeed.",
        image_alt: "Operación logística SELOASA"
      },
      areas: {
        kicker: "Áreas de oportunidad",
        title: "Espacios donde el talento puede aportar valor",
        description: "Estas son algunas de las áreas donde regularmente se integran perfiles para fortalecer la operación y el servicio al cliente.",
        card_1_title: "Operación logística",
        card_1_body: "Perfiles enfocados en ejecución operativa, coordinación de rutas, almacén, monitoreo y atención al detalle.",
        card_2_title: "Calidad y cumplimiento",
        card_2_body: "Posiciones relacionadas con procesos, documentación, seguridad, seguimiento normativo y control operativo.",
        card_3_title: "Soporte y administración",
        card_3_body: "Áreas de apoyo para mantener una operación ordenada, cercana al cliente y enfocada en resultados medibles."
      },
      vacancies: {
        kicker: "Vacantes activas",
        title: "Oportunidades disponibles para integrarte al equipo",
        description: "Estas vacantes se actualizan desde nuestro panel interno de reclutamiento y puedes postular directamente desde esta pagina.",
        apply_button: "Postularme",
        items: [
          {
            id: "coordinador-monitoreo-logistico",
            area: "Monitoreo",
            mode: "Presencial",
            title: "Coordinador de Monitoreo Logístico",
            location: "Lerma, Estado de México",
            schedule: "Tiempo completo",
            summary: "Responsable de dar seguimiento a la operación diaria, visibilidad de unidades e incidencias durante el trayecto.",
            points: [
              "Monitoreo de rutas, GPS y eventos críticos en tiempo real.",
              "Comunicación con operación y clientes ante desviaciones o alertas.",
              "Seguimiento de reportes, evidencias y control de indicadores operativos."
            ]
          },
          {
            id: "auxiliar-almacen-farmaceutico",
            area: "Almacén",
            mode: "Presencial",
            title: "Auxiliar de Almacén Farmacéutico",
            location: "Lerma, Estado de México",
            schedule: "Tiempo completo",
            summary: "Perfil orientado al manejo seguro de producto, control documental y operación diaria dentro de almacenes especializados.",
            points: [
              "Recepción, surtido y acomodo de producto conforme a proceso.",
              "Control de lotes, caducidades y condiciones de temperatura.",
              "Apoyo en inventarios, limpieza operativa y trazabilidad."
            ]
          },
          {
            id: "operador-transporte-refrigerado",
            area: "Transporte",
            mode: "Operación en ruta",
            title: "Operador de Transporte Refrigerado",
            location: "Cobertura local y foránea",
            schedule: "Tiempo completo",
            summary: "Vacante enfocada en entregas con control de temperatura, cumplimiento documental y operación segura de unidades.",
            points: [
              "Traslado de producto sensible bajo lineamientos de cadena de frío.",
              "Verificación de unidad, evidencias de entrega y documentación de ruta.",
              "Cumplimiento de protocolos de seguridad y atención al cliente en entrega."
            ]
          }
        ]
      },
      application: {
        kicker: "Postulación directa",
        title: "Envíanos tus datos y tu CV para aplicar a la vacante de tu interés",
        description: "Completa el formulario con tu nombre completo, correo, teléfono y CV. El archivo se enviará como adjunto al correo configurado para reclutamiento.",
        item_1: "Selecciona una vacante activa y verifica que tus datos estén actualizados.",
        item_2: "Adjunta tu CV en formato PDF, DOC o DOCX con un tamaño máximo de 5 MB.",
        item_3: "Al enviar la postulación, el equipo podrá revisar tu perfil y dar seguimiento por correo."
      },
      form: {
        kicker: "Formulario de postulación",
        title: "Aplica a una vacante desde aquí",
        full_name_label: "Nombre completo",
        full_name_placeholder: "Nombre completo",
        email_label: "Correo electrónico",
        email_placeholder: "Correo electrónico",
        phone_label: "Teléfono con lada",
        phone_placeholder: "+52 55 1234 5678",
        phone_help: "Incluye lada. Ejemplo: +52 55 1234 5678.",
        vacancy_label: "Vacante de interés",
        vacancy_placeholder: "Selecciona una vacante",
        cv_label: "CV adjunto",
        cv_help: "Formatos permitidos: PDF, DOC, DOCX. Tamaño máximo: 5 MB.",
        submit: "Enviar postulación"
      },
      validation: {
        full_name_invalid: "Ingresa tu nombre completo y apellidos.",
        email_invalid: "Ingresa un correo electrónico válido.",
        phone_invalid: "Ingresa un teléfono con lada de 10 a 15 dígitos.",
        vacancy_invalid: "Selecciona una vacante válida.",
        cv_required: "Adjunta tu CV para continuar.",
        cv_invalid: "El CV debe estar en formato PDF, DOC o DOCX.",
        cv_too_large: "El CV no debe exceder 5 MB."
      },
      applicationStatus: {
        success: { type: "alert-success", message: "Tu postulación fue enviada correctamente. Revisaremos tu información y tu CV." },
        error: { type: "alert-danger", message: "No pudimos enviar tu postulación en este momento. Inténtalo nuevamente." },
        invalid_name: { type: "alert-danger", message: "Ingresa tu nombre completo y apellidos para continuar." },
        invalid_email: { type: "alert-danger", message: "Ingresa un correo electrónico válido." },
        invalid_phone: { type: "alert-danger", message: "Ingresa un teléfono con lada de 10 a 15 dígitos." },
        invalid_vacancy: { type: "alert-danger", message: "Selecciona una vacante válida." },
        invalid_file: { type: "alert-danger", message: "El CV debe estar en formato PDF, DOC o DOCX." },
        file_too_large: { type: "alert-warning", message: "El archivo supera el tamaño máximo de 5 MB." },
        upload_error: { type: "alert-danger", message: "Hubo un problema al cargar el archivo. Inténtalo de nuevo." },
        local_dev_unsupported: { type: "alert-warning", message: "Estás usando Live Server y ese entorno no ejecuta PHP. Para enviar postulaciones con CV adjunto, abre el sitio en un servidor con PHP." }
      },
      process: {
        kicker: "Cómo postularte",
        title: "Un proceso claro para encontrar oportunidades afines a tu perfil",
        description: "Te recomendamos seguir estos pasos para revisar vacantes activas y enviar tu postulación de forma ordenada.",
        step_1_title: "Explora las vacantes",
        step_1_body: "Revisa el listado actualizado en nuestro perfil de Indeed y valida qué posición se alinea mejor con tu experiencia.",
        step_2_title: "Prepara tu postulación",
        step_2_body: "Ten listo tu CV y verifica que tu información de contacto y experiencia estén actualizadas.",
        step_3_title: "Aplica por el canal oficial",
        step_3_body: "Envía tu candidatura desde Indeed para que el equipo correspondiente pueda dar seguimiento a tu perfil."
      },
      cta: {
        kicker: "Canal oficial",
        title: "Consulta vacantes activas en Indeed",
        description: "Nuestro perfil en Indeed concentra publicaciones activas y es el medio recomendado para conocer nuevas oportunidades laborales dentro de SELOASA.",
        button: "Ir a Indeed"
      }
    }
  },
  en: {
    careersPage: {
      meta: {
        title: "Careers - Servicios Logísticos Alsera"
      },
      hero: {
        title_accent: "Careers",
        title_main: "at SELOASA",
        description: "Explore opportunities to join SELOASA and keep track of our active openings from one place.",
        image_alt: "SELOASA team"
      },
      overview: {
        kicker: "SELOASA Talent",
        title: "Build your next professional step with us",
        description_1: "We look for people ready to grow within a specialized logistics operation focused on service, compliance, and continuous improvement.",
        description_2: "On this page you can learn about the areas where we usually add talent, how to apply, and the official channel to review available openings.",
        item_1: "Opportunities related to storage, transport, distribution, and operational support.",
        item_2: "Processes aligned with safety, quality, traceability, and compliance.",
        item_3: "Review active openings through our official Indeed channel.",
        image_alt: "SELOASA logistics operation"
      },
      areas: {
        kicker: "Opportunity Areas",
        title: "Spaces where talent can create value",
        description: "These are some of the areas where profiles are regularly added to strengthen operations and customer service.",
        card_1_title: "Logistics operations",
        card_1_body: "Profiles focused on operational execution, route coordination, warehouse activity, monitoring, and attention to detail.",
        card_2_title: "Quality and compliance",
        card_2_body: "Roles related to processes, documentation, safety, regulatory follow-up, and operational control.",
        card_3_title: "Support and administration",
        card_3_body: "Support areas that help maintain an organized operation, close customer attention, and focus on measurable results."
      },
      vacancies: {
        kicker: "Open roles",
        title: "Available opportunities to join the team",
        description: "These openings are updated from our internal recruiting panel and candidates can apply directly from this page.",
        apply_button: "Apply now",
        items: [
          {
            id: "coordinador-monitoreo-logistico",
            area: "Monitoring",
            mode: "On-site",
            title: "Logistics Monitoring Coordinator",
            location: "Lerma, State of Mexico",
            schedule: "Full time",
            summary: "Role focused on daily operational follow-up, fleet visibility, and incident tracking throughout the journey.",
            points: [
              "Monitor routes, GPS activity, and critical events in real time.",
              "Communicate with operations and clients when deviations or alerts occur.",
              "Track reports, evidence, and operational KPI control."
            ]
          },
          {
            id: "auxiliar-almacen-farmaceutico",
            area: "Warehouse",
            mode: "On-site",
            title: "Pharmaceutical Warehouse Assistant",
            location: "Lerma, State of Mexico",
            schedule: "Full time",
            summary: "Profile focused on safe product handling, document control, and daily work within specialized warehouse operations.",
            points: [
              "Receive, pick, and store product according to process.",
              "Control batches, expirations, and temperature conditions.",
              "Support inventories, operational cleanliness, and traceability."
            ]
          },
          {
            id: "operador-transporte-refrigerado",
            area: "Transport",
            mode: "Route operation",
            title: "Refrigerated Transport Operator",
            location: "Local and long-haul coverage",
            schedule: "Full time",
            summary: "Position focused on temperature-controlled deliveries, documentation compliance, and safe vehicle operation.",
            points: [
              "Move sensitive product under cold-chain guidelines.",
              "Verify vehicle condition, delivery evidence, and route documentation.",
              "Follow security protocols and customer service standards during delivery."
            ]
          }
        ]
      },
      application: {
        kicker: "Direct application",
        title: "Send us your details and your CV to apply for the role you are interested in",
        description: "Complete the form with your full name, email, phone number, and CV. The file will be sent as an attachment to the email configured for recruitment.",
        item_1: "Select an active vacancy and make sure your details are up to date.",
        item_2: "Attach your CV in PDF, DOC, or DOCX format with a maximum size of 5 MB.",
        item_3: "Once submitted, the team will be able to review your profile and follow up by email."
      },
      form: {
        kicker: "Application form",
        title: "Apply for a vacancy from this page",
        full_name_label: "Full name",
        full_name_placeholder: "Full name",
        email_label: "Email",
        email_placeholder: "Email",
        phone_label: "Phone with area code",
        phone_placeholder: "+52 55 1234 5678",
        phone_help: "Include area code. Example: +52 55 1234 5678.",
        vacancy_label: "Vacancy of interest",
        vacancy_placeholder: "Select a vacancy",
        cv_label: "Attached CV",
        cv_help: "Allowed formats: PDF, DOC, DOCX. Maximum size: 5 MB.",
        submit: "Submit application"
      },
      validation: {
        full_name_invalid: "Enter your full name and last name.",
        email_invalid: "Enter a valid email address.",
        phone_invalid: "Enter a phone number with area code and 10 to 15 digits.",
        vacancy_invalid: "Select a valid vacancy.",
        cv_required: "Attach your CV to continue.",
        cv_invalid: "The CV must be in PDF, DOC, or DOCX format.",
        cv_too_large: "The CV must not exceed 5 MB."
      },
      applicationStatus: {
        success: { type: "alert-success", message: "Your application was sent successfully. We will review your information and your CV." },
        error: { type: "alert-danger", message: "We could not send your application right now. Please try again." },
        invalid_name: { type: "alert-danger", message: "Enter your full name and last name to continue." },
        invalid_email: { type: "alert-danger", message: "Enter a valid email address." },
        invalid_phone: { type: "alert-danger", message: "Enter a phone number with area code and 10 to 15 digits." },
        invalid_vacancy: { type: "alert-danger", message: "Select a valid vacancy." },
        invalid_file: { type: "alert-danger", message: "The CV must be in PDF, DOC, or DOCX format." },
        file_too_large: { type: "alert-warning", message: "The file exceeds the 5 MB maximum size." },
        upload_error: { type: "alert-danger", message: "There was a problem uploading the file. Please try again." },
        local_dev_unsupported: { type: "alert-warning", message: "You are using Live Server and that environment does not execute PHP. To submit applications with an attached CV, open the site on a PHP-enabled server." }
      },
      process: {
        kicker: "How to apply",
        title: "A clear process to find opportunities that match your profile",
        description: "We recommend following these steps to review active openings and submit your application in an organized way.",
        step_1_title: "Explore openings",
        step_1_body: "Review the updated list on our Indeed profile and identify the role that best matches your experience.",
        step_2_title: "Prepare your application",
        step_2_body: "Have your resume ready and make sure your contact information and experience are up to date.",
        step_3_title: "Apply through the official channel",
        step_3_body: "Submit your application through Indeed so the appropriate team can follow up on your profile."
      },
      cta: {
        kicker: "Official channel",
        title: "Review active openings on Indeed",
        description: "Our Indeed profile gathers active postings and is the recommended channel to learn about new career opportunities at SELOASA.",
        button: "Go to Indeed"
      }
    }
  },
  al: {
    careersPage: {
      meta: {
        title: "Karriere - Servicios Logísticos Alsera"
      },
      hero: {
        title_accent: "Karriere",
        title_main: "bei SELOASA",
        description: "Entdecken Sie Möglichkeiten, Teil von SELOASA zu werden, und verfolgen Sie unsere aktuellen Stellenangebote an einem Ort.",
        image_alt: "SELOASA-Team"
      },
      overview: {
        kicker: "SELOASA Talente",
        title: "Gestalten Sie Ihren nächsten beruflichen Schritt mit uns",
        description_1: "Wir suchen Menschen, die in einer spezialisierten Logistikoperation mit Fokus auf Service, Compliance und kontinuierliche Verbesserung wachsen möchten.",
        description_2: "Auf dieser Seite erfahren Sie, in welchen Bereichen wir meist Talente integrieren, wie Sie sich bewerben können und über welchen offiziellen Kanal offene Stellen veröffentlicht werden.",
        item_1: "Möglichkeiten in Lagerung, Transport, Distribution und operativer Unterstützung.",
        item_2: "Prozesse im Einklang mit Sicherheit, Qualität, Rückverfolgbarkeit und Compliance.",
        item_3: "Aktive Stellenangebote über unseren offiziellen Indeed-Kanal einsehen.",
        image_alt: "Logistikbetrieb von SELOASA"
      },
      areas: {
        kicker: "Einsatzbereiche",
        title: "Bereiche, in denen Talent Mehrwert schafft",
        description: "Dies sind einige der Bereiche, in denen regelmäßig Profile integriert werden, um Betrieb und Kundenservice zu stärken.",
        card_1_title: "Logistikbetrieb",
        card_1_body: "Profile mit Fokus auf operative Ausführung, Routenkoordination, Lager, Monitoring und Detailgenauigkeit.",
        card_2_title: "Qualität und Compliance",
        card_2_body: "Positionen rund um Prozesse, Dokumentation, Sicherheit, regulatorische Nachverfolgung und operative Kontrolle.",
        card_3_title: "Support und Verwaltung",
        card_3_body: "Unterstützungsbereiche für eine geordnete Organisation, Kundennähe und messbare Ergebnisse."
      },
      vacancies: {
        kicker: "Offene Stellen",
        title: "Verfügbare Möglichkeiten, Teil des Teams zu werden",
        description: "Diese Stellen werden uber unser internes Recruiting-Panel aktualisiert und Bewerbungen konnen direkt auf dieser Seite eingereicht werden.",
        apply_button: "Jetzt bewerben",
        items: [
          {
            id: "coordinador-monitoreo-logistico",
            area: "Monitoring",
            mode: "Vor Ort",
            title: "Koordinator für Logistik-Monitoring",
            location: "Lerma, Bundesstaat Mexiko",
            schedule: "Vollzeit",
            summary: "Rolle für die tägliche operative Nachverfolgung, Fahrzeugtransparenz und das Management von Zwischenfällen während der Route.",
            points: [
              "Überwachung von Routen, GPS und kritischen Ereignissen in Echtzeit.",
              "Kommunikation mit Betrieb und Kunden bei Abweichungen oder Warnmeldungen.",
              "Nachverfolgung von Berichten, Nachweisen und operativen Kennzahlen."
            ]
          },
          {
            id: "auxiliar-almacen-farmaceutico",
            area: "Lager",
            mode: "Vor Ort",
            title: "Mitarbeiter Pharma-Lager",
            location: "Lerma, Bundesstaat Mexiko",
            schedule: "Vollzeit",
            summary: "Profil mit Fokus auf sicheren Produktumgang, Dokumentenkontrolle und tägliche Arbeit in spezialisierten Lagerprozessen.",
            points: [
              "Wareneingang, Kommissionierung und Einlagerung gemäß Prozess.",
              "Kontrolle von Chargen, Verfallsdaten und Temperaturbedingungen.",
              "Unterstützung bei Inventuren, operativer Sauberkeit und Rückverfolgbarkeit."
            ]
          },
          {
            id: "operador-transporte-refrigerado",
            area: "Transport",
            mode: "Routenbetrieb",
            title: "Fahrer für Kühltransport",
            location: "Lokale und Fernrouten",
            schedule: "Vollzeit",
            summary: "Position mit Fokus auf temperaturgeführte Lieferungen, Dokumentationskonformität und sicheren Fahrzeugeinsatz.",
            points: [
              "Transport sensibler Produkte nach Kühlkettenvorgaben.",
              "Prüfung des Fahrzeugs, Zustellnachweise und Routenunterlagen.",
              "Einhaltung von Sicherheitsprotokollen und Kundenservice bei der Zustellung."
            ]
          }
        ]
      },
      application: {
        kicker: "Direktbewerbung",
        title: "Senden Sie uns Ihre Daten und Ihren Lebenslauf für die Stelle, die Sie interessiert",
        description: "Füllen Sie das Formular mit Ihrem vollständigen Namen, Ihrer E-Mail, Ihrer Telefonnummer und Ihrem Lebenslauf aus. Die Datei wird als Anhang an die für Recruiting konfigurierte E-Mail gesendet.",
        item_1: "Wählen Sie eine aktive Stelle aus und prüfen Sie, ob Ihre Daten aktuell sind.",
        item_2: "Fügen Sie Ihren Lebenslauf im Format PDF, DOC oder DOCX mit maximal 5 MB hinzu.",
        item_3: "Nach dem Absenden kann das Team Ihr Profil prüfen und per E-Mail nachfassen."
      },
      form: {
        kicker: "Bewerbungsformular",
        title: "Bewerben Sie sich direkt von dieser Seite",
        full_name_label: "Vollständiger Name",
        full_name_placeholder: "Vollständiger Name",
        email_label: "E-Mail",
        email_placeholder: "E-Mail",
        phone_label: "Telefon mit Vorwahl",
        phone_placeholder: "+52 55 1234 5678",
        phone_help: "Bitte mit Vorwahl eingeben. Beispiel: +52 55 1234 5678.",
        vacancy_label: "Interessierende Stelle",
        vacancy_placeholder: "Wählen Sie eine Stelle aus",
        cv_label: "Lebenslauf als Anhang",
        cv_help: "Erlaubte Formate: PDF, DOC, DOCX. Maximale Größe: 5 MB.",
        submit: "Bewerbung senden"
      },
      validation: {
        full_name_invalid: "Geben Sie Ihren vollständigen Vor- und Nachnamen ein.",
        email_invalid: "Geben Sie eine gültige E-Mail-Adresse ein.",
        phone_invalid: "Geben Sie eine Telefonnummer mit Vorwahl und 10 bis 15 Ziffern ein.",
        vacancy_invalid: "Wählen Sie eine gültige Stelle aus.",
        cv_required: "Fügen Sie Ihren Lebenslauf hinzu, um fortzufahren.",
        cv_invalid: "Der Lebenslauf muss im Format PDF, DOC oder DOCX vorliegen.",
        cv_too_large: "Der Lebenslauf darf 5 MB nicht überschreiten."
      },
      applicationStatus: {
        success: { type: "alert-success", message: "Ihre Bewerbung wurde erfolgreich gesendet. Wir prüfen Ihre Angaben und Ihren Lebenslauf." },
        error: { type: "alert-danger", message: "Ihre Bewerbung konnte derzeit nicht gesendet werden. Bitte versuchen Sie es erneut." },
        invalid_name: { type: "alert-danger", message: "Geben Sie Ihren vollständigen Vor- und Nachnamen ein, um fortzufahren." },
        invalid_email: { type: "alert-danger", message: "Geben Sie eine gültige E-Mail-Adresse ein." },
        invalid_phone: { type: "alert-danger", message: "Geben Sie eine Telefonnummer mit Vorwahl und 10 bis 15 Ziffern ein." },
        invalid_vacancy: { type: "alert-danger", message: "Wählen Sie eine gültige Stelle aus." },
        invalid_file: { type: "alert-danger", message: "Der Lebenslauf muss im Format PDF, DOC oder DOCX vorliegen." },
        file_too_large: { type: "alert-warning", message: "Die Datei überschreitet die maximale Größe von 5 MB." },
        upload_error: { type: "alert-danger", message: "Beim Hochladen der Datei ist ein Problem aufgetreten. Bitte versuchen Sie es erneut." },
        local_dev_unsupported: { type: "alert-warning", message: "Sie verwenden Live Server und diese Umgebung führt kein PHP aus. Für Bewerbungen mit angehängtem Lebenslauf öffnen Sie die Website bitte auf einem Server mit PHP-Unterstützung." }
      },
      process: {
        kicker: "So bewerben Sie sich",
        title: "Ein klarer Prozess, um passende Möglichkeiten für Ihr Profil zu finden",
        description: "Wir empfehlen diese Schritte, um offene Stellen zu prüfen und Ihre Bewerbung strukturiert einzureichen.",
        step_1_title: "Stellenangebote prüfen",
        step_1_body: "Sehen Sie sich die aktuelle Liste in unserem Indeed-Profil an und identifizieren Sie die Position, die am besten zu Ihrer Erfahrung passt.",
        step_2_title: "Bewerbung vorbereiten",
        step_2_body: "Halten Sie Ihren Lebenslauf bereit und stellen Sie sicher, dass Ihre Kontaktdaten und Erfahrungen aktuell sind.",
        step_3_title: "Über den offiziellen Kanal bewerben",
        step_3_body: "Senden Sie Ihre Bewerbung über Indeed, damit das zuständige Team Ihr Profil weiterverfolgen kann."
      },
      cta: {
        kicker: "Offizieller Kanal",
        title: "Aktive Stellen bei Indeed ansehen",
        description: "Unser Indeed-Profil bündelt aktive Ausschreibungen und ist der empfohlene Kanal, um neue Karrieremöglichkeiten bei SELOASA kennenzulernen.",
        button: "Zu Indeed"
      }
    }
  },
  pt: {
    careersPage: {
      meta: {
        title: "Carreiras - Servicios Logísticos Alsera"
      },
      hero: {
        title_accent: "Carreiras",
        title_main: "na SELOASA",
        description: "Conheça oportunidades para fazer parte da SELOASA e acompanhe nossas vagas ativas em um só lugar.",
        image_alt: "Equipe SELOASA"
      },
      overview: {
        kicker: "Talento SELOASA",
        title: "Construa sua próxima etapa profissional conosco",
        description_1: "Buscamos pessoas que queiram crescer em uma operação logística especializada, com foco em serviço, conformidade e melhoria contínua.",
        description_2: "Nesta página você pode conhecer as áreas em que normalmente integramos talentos, a forma de se candidatar e o canal oficial para revisar vagas disponíveis.",
        item_1: "Oportunidades ligadas a armazenagem, transporte, distribuição e suporte operacional.",
        item_2: "Processos alinhados com segurança, qualidade, rastreabilidade e conformidade.",
        item_3: "Consulte vagas ativas por meio do nosso canal oficial no Indeed.",
        image_alt: "Operação logística da SELOASA"
      },
      areas: {
        kicker: "Áreas de oportunidade",
        title: "Espaços onde o talento pode gerar valor",
        description: "Estas são algumas das áreas em que perfis são integrados regularmente para fortalecer a operação e o atendimento ao cliente.",
        card_1_title: "Operação logística",
        card_1_body: "Perfis focados em execução operacional, coordenação de rotas, armazém, monitoramento e atenção aos detalhes.",
        card_2_title: "Qualidade e conformidade",
        card_2_body: "Posições relacionadas a processos, documentação, segurança, acompanhamento regulatório e controle operacional.",
        card_3_title: "Suporte e administração",
        card_3_body: "Áreas de apoio para manter uma operação organizada, próxima do cliente e orientada a resultados mensuráveis."
      },
      vacancies: {
        kicker: "Vagas ativas",
        title: "Oportunidades disponíveis para integrar a equipe",
        description: "Essas vagas sao atualizadas em nosso painel interno de recrutamento e as candidaturas podem ser enviadas diretamente nesta pagina.",
        apply_button: "Candidatar-me",
        items: [
          {
            id: "coordinador-monitoreo-logistico",
            area: "Monitoramento",
            mode: "Presencial",
            title: "Coordenador de Monitoramento Logístico",
            location: "Lerma, Estado do México",
            schedule: "Tempo integral",
            summary: "Função voltada ao acompanhamento diário da operação, visibilidade das unidades e gestão de incidentes durante a rota.",
            points: [
              "Monitoramento de rotas, GPS e eventos críticos em tempo real.",
              "Comunicação com operação e clientes em caso de desvios ou alertas.",
              "Acompanhamento de relatórios, evidências e indicadores operacionais."
            ]
          },
          {
            id: "auxiliar-almacen-farmaceutico",
            area: "Armazém",
            mode: "Presencial",
            title: "Auxiliar de Armazém Farmacêutico",
            location: "Lerma, Estado do México",
            schedule: "Tempo integral",
            summary: "Perfil orientado ao manuseio seguro de produtos, controle documental e operação diária em armazéns especializados.",
            points: [
              "Recebimento, separação e acomodação de produtos conforme o processo.",
              "Controle de lotes, vencimentos e condições de temperatura.",
              "Apoio em inventários, limpeza operacional e rastreabilidade."
            ]
          },
          {
            id: "operador-transporte-refrigerado",
            area: "Transporte",
            mode: "Operação em rota",
            title: "Operador de Transporte Refrigerado",
            location: "Cobertura local e rodoviária",
            schedule: "Tempo integral",
            summary: "Vaga voltada a entregas com controle de temperatura, conformidade documental e operação segura das unidades.",
            points: [
              "Transporte de produtos sensíveis sob diretrizes de cadeia do frio.",
              "Verificação da unidade, comprovantes de entrega e documentação da rota.",
              "Cumprimento de protocolos de segurança e atendimento ao cliente na entrega."
            ]
          }
        ]
      },
      application: {
        kicker: "Candidatura direta",
        title: "Envie seus dados e seu currículo para a vaga de seu interesse",
        description: "Preencha o formulário com seu nome completo, e-mail, telefone e currículo. O arquivo será enviado como anexo para o e-mail configurado para recrutamento.",
        item_1: "Selecione uma vaga ativa e confirme se seus dados estão atualizados.",
        item_2: "Anexe seu currículo em PDF, DOC ou DOCX com tamanho máximo de 5 MB.",
        item_3: "Após o envio, a equipe poderá analisar seu perfil e dar retorno por e-mail."
      },
      form: {
        kicker: "Formulário de candidatura",
        title: "Candidate-se a uma vaga por aqui",
        full_name_label: "Nome completo",
        full_name_placeholder: "Nome completo",
        email_label: "E-mail",
        email_placeholder: "E-mail",
        phone_label: "Telefone com DDD",
        phone_placeholder: "+55 11 98765 4321",
        phone_help: "Inclua o DDD. Exemplo: +55 11 98765 4321.",
        vacancy_label: "Vaga de interesse",
        vacancy_placeholder: "Selecione uma vaga",
        cv_label: "Currículo anexado",
        cv_help: "Formatos permitidos: PDF, DOC, DOCX. Tamanho máximo: 5 MB.",
        submit: "Enviar candidatura"
      },
      validation: {
        full_name_invalid: "Informe seu nome completo e sobrenome.",
        email_invalid: "Informe um e-mail válido.",
        phone_invalid: "Informe um telefone com DDD e entre 10 e 15 dígitos.",
        vacancy_invalid: "Selecione uma vaga válida.",
        cv_required: "Anexe seu currículo para continuar.",
        cv_invalid: "O currículo deve estar em PDF, DOC ou DOCX.",
        cv_too_large: "O currículo não deve exceder 5 MB."
      },
      applicationStatus: {
        success: { type: "alert-success", message: "Sua candidatura foi enviada com sucesso. Vamos revisar seus dados e seu currículo." },
        error: { type: "alert-danger", message: "Não foi possível enviar sua candidatura neste momento. Tente novamente." },
        invalid_name: { type: "alert-danger", message: "Informe seu nome completo e sobrenome para continuar." },
        invalid_email: { type: "alert-danger", message: "Informe um e-mail válido." },
        invalid_phone: { type: "alert-danger", message: "Informe um telefone com DDD e entre 10 e 15 dígitos." },
        invalid_vacancy: { type: "alert-danger", message: "Selecione uma vaga válida." },
        invalid_file: { type: "alert-danger", message: "O currículo deve estar em PDF, DOC ou DOCX." },
        file_too_large: { type: "alert-warning", message: "O arquivo excede o tamanho máximo de 5 MB." },
        upload_error: { type: "alert-danger", message: "Houve um problema ao carregar o arquivo. Tente novamente." },
        local_dev_unsupported: { type: "alert-warning", message: "Você está usando o Live Server e esse ambiente não executa PHP. Para enviar candidaturas com currículo em anexo, abra o site em um servidor com PHP." }
      },
      process: {
        kicker: "Como se candidatar",
        title: "Um processo claro para encontrar oportunidades compatíveis com o seu perfil",
        description: "Recomendamos seguir estes passos para revisar vagas ativas e enviar sua candidatura de forma organizada.",
        step_1_title: "Explore as vagas",
        step_1_body: "Revise a lista atualizada em nosso perfil do Indeed e identifique a posição mais alinhada à sua experiência.",
        step_2_title: "Prepare sua candidatura",
        step_2_body: "Tenha seu currículo pronto e verifique se suas informações de contato e experiência estão atualizadas.",
        step_3_title: "Candidate-se pelo canal oficial",
        step_3_body: "Envie sua candidatura pelo Indeed para que a equipe correspondente possa acompanhar o seu perfil."
      },
      cta: {
        kicker: "Canal oficial",
        title: "Consulte vagas ativas no Indeed",
        description: "Nosso perfil no Indeed concentra publicações ativas e é o meio recomendado para conhecer novas oportunidades de carreira na SELOASA.",
        button: "Ir para o Indeed"
      }
    }
  },
  fr: {
    careersPage: {
      meta: {
        title: "Carrières - Servicios Logísticos Alsera"
      },
      hero: {
        title_accent: "Carrières",
        title_main: "chez SELOASA",
        description: "Découvrez les opportunités pour rejoindre SELOASA et suivez nos postes ouverts depuis un seul endroit.",
        image_alt: "Équipe SELOASA"
      },
      overview: {
        kicker: "Talents SELOASA",
        title: "Construisez votre prochaine étape professionnelle avec nous",
        description_1: "Nous recherchons des personnes souhaitant évoluer dans une opération logistique spécialisée, axée sur le service, la conformité et l'amélioration continue.",
        description_2: "Sur cette page, vous pouvez connaître les domaines dans lesquels nous intégrons habituellement des talents, la manière de postuler et le canal officiel pour consulter les postes disponibles.",
        item_1: "Opportunités liées au stockage, au transport, à la distribution et au support opérationnel.",
        item_2: "Processus alignés sur la sécurité, la qualité, la traçabilité et la conformité.",
        item_3: "Consultez les postes ouverts via notre canal officiel Indeed.",
        image_alt: "Opération logistique SELOASA"
      },
      areas: {
        kicker: "Domaines d'opportunité",
        title: "Des espaces où le talent peut créer de la valeur",
        description: "Voici quelques domaines dans lesquels des profils sont régulièrement intégrés afin de renforcer l'opération et le service client.",
        card_1_title: "Opération logistique",
        card_1_body: "Profils axés sur l'exécution opérationnelle, la coordination des itinéraires, l'entrepôt, le suivi et le souci du détail.",
        card_2_title: "Qualité et conformité",
        card_2_body: "Postes liés aux processus, à la documentation, à la sécurité, au suivi réglementaire et au contrôle opérationnel.",
        card_3_title: "Support et administration",
        card_3_body: "Domaines de soutien pour maintenir une opération organisée, proche du client et orientée vers des résultats mesurables."
      },
      vacancies: {
        kicker: "Postes ouverts",
        title: "Opportunités disponibles pour rejoindre l'équipe",
        description: "Ces postes sont mis a jour depuis notre panneau interne de recrutement et les candidatures peuvent etre envoyees directement depuis cette page.",
        apply_button: "Postuler",
        items: [
          {
            id: "coordinador-monitoreo-logistico",
            area: "Supervision",
            mode: "Présentiel",
            title: "Coordinateur de supervision logistique",
            location: "Lerma, État de Mexico",
            schedule: "Temps plein",
            summary: "Rôle chargé du suivi quotidien de l'opération, de la visibilité des unités et de la gestion des incidents pendant le trajet.",
            points: [
              "Suivi des itinéraires, du GPS et des événements critiques en temps réel.",
              "Communication avec l'opération et les clients en cas d'écarts ou d'alertes.",
              "Suivi des rapports, des preuves et des indicateurs opérationnels."
            ]
          },
          {
            id: "auxiliar-almacen-farmaceutico",
            area: "Entrepôt",
            mode: "Présentiel",
            title: "Assistant d'entrepôt pharmaceutique",
            location: "Lerma, État de Mexico",
            schedule: "Temps plein",
            summary: "Profil orienté vers la manipulation sécurisée des produits, le contrôle documentaire et l'activité quotidienne dans des entrepôts spécialisés.",
            points: [
              "Réception, préparation et rangement des produits selon le processus.",
              "Contrôle des lots, des dates de péremption et des conditions de température.",
              "Soutien aux inventaires, à la propreté opérationnelle et à la traçabilité."
            ]
          },
          {
            id: "operador-transporte-refrigerado",
            area: "Transport",
            mode: "Opération en tournée",
            title: "Opérateur de transport réfrigéré",
            location: "Couverture locale et longue distance",
            schedule: "Temps plein",
            summary: "Poste axé sur les livraisons sous température contrôlée, la conformité documentaire et l'exploitation sécurisée des véhicules.",
            points: [
              "Transport de produits sensibles selon les exigences de la chaîne du froid.",
              "Vérification du véhicule, des preuves de livraison et de la documentation de route.",
              "Respect des protocoles de sécurité et du service au client lors de la livraison."
            ]
          }
        ]
      },
      application: {
        kicker: "Candidature directe",
        title: "Envoyez-nous vos coordonnées et votre CV pour le poste qui vous intéresse",
        description: "Complétez le formulaire avec votre nom complet, votre courriel, votre téléphone et votre CV. Le fichier sera envoyé en pièce jointe à l'adresse configurée pour le recrutement.",
        item_1: "Sélectionnez un poste actif et vérifiez que vos informations sont à jour.",
        item_2: "Joignez votre CV au format PDF, DOC ou DOCX avec une taille maximale de 5 Mo.",
        item_3: "Une fois la candidature envoyée, l'équipe pourra examiner votre profil et vous recontacter par courriel."
      },
      form: {
        kicker: "Formulaire de candidature",
        title: "Postulez à un poste depuis cette page",
        full_name_label: "Nom complet",
        full_name_placeholder: "Nom complet",
        email_label: "Courriel",
        email_placeholder: "Courriel",
        phone_label: "Téléphone avec indicatif",
        phone_placeholder: "+33 6 12 34 56 78",
        phone_help: "Incluez l'indicatif. Exemple : +33 6 12 34 56 78.",
        vacancy_label: "Poste souhaité",
        vacancy_placeholder: "Sélectionnez un poste",
        cv_label: "CV en pièce jointe",
        cv_help: "Formats autorisés : PDF, DOC, DOCX. Taille maximale : 5 Mo.",
        submit: "Envoyer la candidature"
      },
      validation: {
        full_name_invalid: "Saisissez votre nom complet et votre nom de famille.",
        email_invalid: "Saisissez une adresse courriel valide.",
        phone_invalid: "Saisissez un téléphone avec indicatif et 10 à 15 chiffres.",
        vacancy_invalid: "Sélectionnez un poste valide.",
        cv_required: "Joignez votre CV pour continuer.",
        cv_invalid: "Le CV doit être au format PDF, DOC ou DOCX.",
        cv_too_large: "Le CV ne doit pas dépasser 5 Mo."
      },
      applicationStatus: {
        success: { type: "alert-success", message: "Votre candidature a été envoyée avec succès. Nous allons examiner vos informations et votre CV." },
        error: { type: "alert-danger", message: "Nous n'avons pas pu envoyer votre candidature pour le moment. Veuillez réessayer." },
        invalid_name: { type: "alert-danger", message: "Saisissez votre nom complet et votre nom de famille pour continuer." },
        invalid_email: { type: "alert-danger", message: "Saisissez une adresse courriel valide." },
        invalid_phone: { type: "alert-danger", message: "Saisissez un téléphone avec indicatif et 10 à 15 chiffres." },
        invalid_vacancy: { type: "alert-danger", message: "Sélectionnez un poste valide." },
        invalid_file: { type: "alert-danger", message: "Le CV doit être au format PDF, DOC ou DOCX." },
        file_too_large: { type: "alert-warning", message: "Le fichier dépasse la taille maximale de 5 Mo." },
        upload_error: { type: "alert-danger", message: "Un problème est survenu lors du téléchargement du fichier. Veuillez réessayer." },
        local_dev_unsupported: { type: "alert-warning", message: "Vous utilisez Live Server et cet environnement n'exécute pas PHP. Pour envoyer des candidatures avec CV en pièce jointe, ouvrez le site sur un serveur prenant PHP en charge." }
      },
      process: {
        kicker: "Comment postuler",
        title: "Un processus clair pour trouver des opportunités adaptées à votre profil",
        description: "Nous vous recommandons de suivre ces étapes pour consulter les postes ouverts et envoyer votre candidature de manière structurée.",
        step_1_title: "Explorez les postes",
        step_1_body: "Consultez la liste actualisée sur notre profil Indeed et identifiez le poste le plus adapté à votre expérience.",
        step_2_title: "Préparez votre candidature",
        step_2_body: "Ayez votre CV prêt et vérifiez que vos coordonnées et votre expérience sont à jour.",
        step_3_title: "Postulez via le canal officiel",
        step_3_body: "Envoyez votre candidature via Indeed afin que l'équipe concernée puisse suivre votre profil."
      },
      cta: {
        kicker: "Canal officiel",
        title: "Consultez les postes ouverts sur Indeed",
        description: "Notre profil Indeed regroupe les publications actives et constitue le canal recommandé pour découvrir de nouvelles opportunités de carrière chez SELOASA.",
        button: "Aller sur Indeed"
      }
    }
  }
};
