UPDATE member_documents
SET
  filename = 'folgt.pdf',
  description = 'Aktuelle Vereinssatzung – die PDF-Datei wird noch ergänzt.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'doc-satzung';

UPDATE member_documents
SET
  filename = 'folgt.pdf',
  description = 'Formular für neue Mitglieder – die PDF-Datei wird noch ergänzt.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'doc-beitritt';

UPDATE member_documents
SET
  filename = 'folgt.pdf',
  description = 'Protokoll der letzten Mitgliederversammlung – die PDF-Datei wird noch ergänzt.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'doc-protokoll-2025';
