UPDATE media_events
SET
  description = 'Ein gemeinsamer Ausflug in die Domstadt – mit Zeit für Stadt, Gespräche und gesellige Momente. Der Rückblick zeigt Eindrücke unserer Tour und die besondere Stimmung unterwegs.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'koeln-2024';

UPDATE media_events
SET
  description = 'Unsere Tour nach Düsseldorf führte uns mitten ins rheinische Leben. Zwischen Altstadt, Gemeinschaft und guter Laune sind viele Erinnerungen entstanden.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'duesseldorf-2025';

UPDATE media_events
SET
  description = 'Leipzig war unser nächstes gemeinsames Ziel: Kultur, Innenstadt, gemeinsame Zeit und viele schöne Momente. Das Video von Dennis hält die Eindrücke der Tour fest.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'leipzig-2026';
