CREATE TABLE IF NOT EXISTS member_news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  priority INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  filename TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_helpers (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  task TEXT NOT NULL,
  contact_person TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'besetzt')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_member_news_visible_priority
  ON member_news (visible, priority DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_documents_visible
  ON member_documents (visible, category ASC, title ASC);

CREATE INDEX IF NOT EXISTS idx_member_events_visible_date
  ON member_events (visible, event_date ASC);

CREATE INDEX IF NOT EXISTS idx_member_helpers_status
  ON member_helpers (status ASC, event_name ASC);

INSERT OR IGNORE INTO member_news (
  id, title, description, category, priority, visible, created_at, updated_at
) VALUES
  (
    'news-fahrplanung-2026',
    'Fahrplanung für 2026',
    'Der Vorstand sammelt Vorschläge für Ausflüge und Vereinsfahrten im kommenden Jahr. Ideen bitte bis Ende März an den Vorstand melden.',
    'Organisation',
    10,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'news-mitgliederversammlung',
    'Mitgliederversammlung',
    'Die nächste Mitgliederversammlung findet im Vereinsheim statt. Tagesordnung und Unterlagen werden rechtzeitig im Mitgliederbereich veröffentlicht.',
    'Verein',
    8,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'news-schuetzenfest-helfer',
    'Helfer für das Schützenfest gesucht',
    'Für Auf- und Abbau sowie Bewirtung werden noch Mitglieder gebraucht. Wer Zeit hat, meldet sich bitte beim Vorstand.',
    'Helfer',
    6,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT OR IGNORE INTO member_documents (
  id, title, description, filename, category, visible, created_at, updated_at
) VALUES
  (
    'doc-satzung',
    'Satzung des Kulturvereins',
    'Aktuelle Vereinssatzung in der gültigen Fassung.',
    'satzung-kulturverein.pdf',
    'Vereinsrecht',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'doc-beitritt',
    'Beitrittsformular',
    'Formular für neue Mitglieder zum Ausdrucken und Ausfüllen.',
    'beitrittsformular.pdf',
    'Formulare',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'doc-protokoll-2025',
    'Protokoll Mitgliederversammlung 2025',
    'Protokoll der letzten Mitgliederversammlung.',
    'protokoll-mitgliederversammlung-2025.pdf',
    'Protokolle',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT OR IGNORE INTO member_events (
  id, title, event_date, event_time, location, description, visible, created_at, updated_at
) VALUES
  (
    'event-vorstandssitzung-maerz',
    'Vorstandssitzung',
    '2026-03-20',
    '19:30',
    'Vereinsheim Wölpinghausen',
    'Monatliche Vorstandssitzung – alle interessierten Mitglieder sind zum Informationsblock willkommen.',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'event-planungstag-fahrt',
    'Planungstag Ausflüge 2026',
    '2026-04-12',
    '15:00',
    'Vereinsheim Wölpinghausen',
    'Gemeinsame Planung der Vereinsfahrten für das laufende Jahr.',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'event-mitgliederversammlung',
    'Mitgliederversammlung',
    '2026-05-15',
    '19:00',
    'Vereinsheim Wölpinghausen',
    'Jährliche Mitgliederversammlung mit Berichten, Wahlen und Diskussion.',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT OR IGNORE INTO member_helpers (
  id, event_name, task, contact_person, status, created_at, updated_at
) VALUES
  (
    'helper-schuetzenfest-aufaufbau',
    'Schützenfest Wölpinghausen',
    'Auf- und Abbau der Bewirtung',
    'Vorstand Kulturverein',
    'offen',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'helper-schuetzenfest-kasse',
    'Schützenfest Wölpinghausen',
    'Kassenbetreuung am Festabend',
    'Vorstand Kulturverein',
    'offen',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'helper-ausflug-bus',
    'Ausflug Leipzig 2026',
    'Bus-Einteilung und Check-in am Abfahrtstag',
    'Organisationsteam',
    'besetzt',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
