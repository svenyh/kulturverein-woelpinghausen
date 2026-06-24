-- Öffentlich sichere Inhalte: keine vertraulichen Daten, keine Fake-PDFs, keine erfundenen Namen.

UPDATE member_news
SET
  description = 'Der Vorstand sammelt Vorschläge für Ausflüge und Vereinsfahrten. Details folgen – bei Fragen bitte an den Vorstand wenden.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'news-fahrplanung-2026';

UPDATE member_news
SET
  description = 'Termin und Unterlagen werden rechtzeitig veröffentlicht. Derzeit in Vorbereitung.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'news-mitgliederversammlung';

UPDATE member_news
SET
  description = 'Für Auf- und Abbau sowie Bewirtung wird Unterstützung gesucht. Bei Interesse bitte an den Vorstand wenden.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'news-schuetzenfest-helfer';

UPDATE member_documents
SET
  description = 'Vereinssatzung – in Vorbereitung, Datei wird ergänzt.',
  filename = 'folgt.pdf',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'doc-satzung';

UPDATE member_documents
SET
  description = 'Beitrittsformular – in Vorbereitung, Datei wird ergänzt.',
  filename = 'folgt.pdf',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'doc-beitritt';

UPDATE member_documents
SET
  title = 'Protokoll Mitgliederversammlung (in Vorbereitung)',
  description = 'Protokoll – in Vorbereitung, Datei wird ergänzt. Es werden keine vertraulichen Inhalte veröffentlicht.',
  filename = 'folgt.pdf',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'doc-protokoll-2025';

UPDATE member_events
SET
  title = 'Infoabend im Vereinsheim',
  description = 'Gemeinsamer Informationsabend – Details werden noch bekannt gegeben.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'event-vorstandssitzung-maerz';

UPDATE member_events
SET
  description = 'Gemeinsame Planung der Vereinsfahrten – Termin in Vorbereitung.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'event-planungstag-fahrt';

UPDATE member_events
SET
  description = 'Jährliche Mitgliederversammlung – Einladung und Tagesordnung folgen.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'event-mitgliederversammlung';

UPDATE member_helpers
SET
  contact_person = 'Vorstand',
  updated_at = CURRENT_TIMESTAMP
WHERE id IN ('helper-schuetzenfest-aufaufbau', 'helper-schuetzenfest-kasse', 'helper-ausflug-bus');
