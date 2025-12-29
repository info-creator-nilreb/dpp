# Audit Logging Integration - Übersicht

## Implementierte Loggings

### ✅ DPP-Operationen
- **CREATE**: `POST /api/app/dpp` - DPP erstellt
- **UPDATE**: `PUT /api/app/dpp/[dppId]` - Alle Feldänderungen einzeln geloggt
- **PUBLISH**: `POST /api/app/dpp/[dppId]/publish` - DPP veröffentlicht
- **DELETE (Media)**: `DELETE /api/app/dpp/[dppId]/media/[mediaId]` - DPP Media gelöscht

### ✅ Template-Operationen (Super Admin)
- **CREATE**: `POST /api/super-admin/templates` - Template erstellt
- **UPDATE**: `PUT /api/super-admin/templates/[id]` - Template aktualisiert
- **DELETE**: `DELETE /api/super-admin/templates/[id]` - Template gelöscht

### ✅ Membership-Operationen (Super Admin)
- **USER_ADDED**: `POST /api/super-admin/organizations/[id]/members` - User zu Organisation hinzugefügt
- **USER_REMOVED**: `DELETE /api/super-admin/organizations/[id]/members` - User von Organisation entfernt
- **ROLE_CHANGE**: `POST /api/super-admin/organizations/[id]/members` (Update) - Rolle geändert

## Noch nicht implementiert

### ❌ DPP-Operationen
- **DELETE**: DPP löschen (wenn implementiert)
- **ARCHIVE**: DPP archivieren (wenn implementiert)
- **EXPORT**: DPP exportieren (wenn implementiert)

### ❌ DPP_VERSION
- Aktuell werden Versionen nicht direkt geloggt (nur über PUBLISH)

### ❌ DPP_CONTENT
- Aktuell nicht verwendet

### ❌ DPP_PERMISSION
- **PERMISSION_CHANGED**: DPP-Berechtigungen ändern (wenn implementiert)

### ❌ User-Operationen
- **CREATE**: User-Registrierung
- **UPDATE**: User-Profil ändern

### ❌ Organization-Operationen
- **CREATE**: Organisation erstellen
- **UPDATE**: Organisation aktualisieren

### ❌ AI-Operationen
- **AI_SUGGESTION_GENERATED**: KI-Vorschlag erstellt
- **AI_SUGGESTION_ACCEPTED**: KI-Vorschlag übernommen
- **AI_SUGGESTION_MODIFIED**: KI-Vorschlag angepasst
- **AI_SUGGESTION_REJECTED**: KI-Vorschlag verworfen
- **AI_AUTO_FILL_APPLIED**: KI-Auto-Ausfüllung angewendet
- **AI_ANALYSIS_RUN**: KI-Analyse ausgeführt
- **AI_CONFIDENCE_SCORE_UPDATED**: KI-Vertrauensbewertung aktualisiert

### ❌ System-Operationen
- System-Aktionen (automatisierte Prozesse)

## Quellen (Sources)

- ✅ **UI**: Verwendet in allen implementierten Loggings
- ❌ **API**: Noch nicht verwendet (sollte bei API-Calls verwendet werden)
- ❌ **IMPORT**: Noch nicht verwendet (sollte bei Import-Operationen verwendet werden)
- ❌ **AI**: Noch nicht verwendet (sollte bei AI-Aktionen verwendet werden)
- ❌ **SYSTEM**: Noch nicht verwendet (sollte bei System-Aktionen verwendet werden)

## Fehlerbehebung

### API-Route Fehler
- Verbessertes Error-Handling mit detailliertem Logging
- JSON-Filter-Syntax korrigiert (vereinfacht, da DPP_VERSION/DPP_CONTENT nicht geloggt werden)
- Source-Filter korrigiert (kombiniert notIn korrekt)

### Bekannte Probleme
- JSON-Filter für metadata könnte bei PostgreSQL problematisch sein
- Wenn keine Logs vorhanden sind, wird "Keine Audit Logs gefunden" angezeigt (korrekt)
- Fehlermeldung "Logs können nicht geladen werden" sollte jetzt detailliertere Informationen liefern


