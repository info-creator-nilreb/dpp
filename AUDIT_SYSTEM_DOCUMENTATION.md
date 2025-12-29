# Audit & AI Logging System - Dokumentation

## Übersicht

Das Audit & AI Logging System ist ein vollständig auditierbares, unveränderliches, rollenbasiertes System zur Nachverfolgung aller Aktionen im System. Es ist ESPR-konform und unterstützt Traceability, Accountability, Explainability und Legal Defensibility für menschliche, System- und KI-gestützte Aktionen.

## Kernprinzipien

1. **Append-only & Immutable**: Audit Logs können nicht aktualisiert oder gelöscht werden
2. **Read-only in UI**: Logs sind in der Benutzeroberfläche schreibgeschützt
3. **ESPR-konform**: Entworfen für regulatorische Audits (ESPR)
4. **Klare Unterscheidung**: Human, System und AI-Aktionen werden klar getrennt
5. **Human-in-the-Loop**: Explizite Governance für AI-Aktionen
6. **Skalierbar**: Für große Datenmengen optimiert

## Datenmodell

### PlatformAuditLog Schema

```prisma
model PlatformAuditLog {
  id                String   @id @default(cuid())
  timestamp         DateTime @default(now())
  actorId           String?
  actorRole          String?
  organizationId    String?
  actionType        String
  entityType        String
  entityId          String?
  fieldName         String?
  oldValue          String?  // JSON stringified
  newValue          String?  // JSON stringified
  source            String   // UI | API | IMPORT | AI | SYSTEM
  complianceRelevant Boolean @default(false)
  versionId         String?
  ipAddress         String?
  metadata          Json?
  
  // AI-specific fields
  aiModel           String?
  aiModelVersion    String?
  aiPromptId        String?
  aiInputSources    String?  // JSON array
  aiConfidenceScore Float?
  aiExplainabilityNote String?
  humanInTheLoop    Boolean?
  finalDecisionBy   String?
  regulatoryImpact  String?  // low | medium | high
}
```

## Action Types

### Human / System Actions
- `CREATE` - Erstellung einer Entität
- `UPDATE` - Aktualisierung einer Entität
- `DELETE` - Löschung einer Entität
- `PUBLISH` - Veröffentlichung
- `ARCHIVE` - Archivierung
- `EXPORT` - Export
- `ROLE_CHANGE` - Rollenänderung
- `USER_ADDED` - Benutzer hinzugefügt
- `USER_REMOVED` - Benutzer entfernt
- `PERMISSION_CHANGED` - Berechtigung geändert

### AI-Specific Actions
- `AI_SUGGESTION_GENERATED` - AI-Vorschlag generiert
- `AI_SUGGESTION_ACCEPTED` - AI-Vorschlag akzeptiert
- `AI_SUGGESTION_MODIFIED` - AI-Vorschlag modifiziert
- `AI_SUGGESTION_REJECTED` - AI-Vorschlag abgelehnt
- `AI_AUTO_FILL_APPLIED` - AI Auto-Fill angewendet
- `AI_ANALYSIS_RUN` - AI-Analyse durchgeführt
- `AI_CONFIDENCE_SCORE_UPDATED` - AI-Confidence-Score aktualisiert

## Rollenbasierte Zugriffskontrolle

### Super Admin
- Vollzugriff auf alle Audit Logs plattformweit
- Einschließlich System- und AI-Events
- Kann IP-Adressen sehen
- Cross-Organization-Events sichtbar

### Organization Admin
- Read-only Zugriff auf alle Audit Logs ihrer Organisation
- Einschließlich DPPs, Versionen, Benutzer und AI-Aktionen
- IP-Adressen werden maskiert
- Keine System-Events sichtbar

### Organization Editor (Member)
- Read-only Zugriff auf Audit Logs zu Entitäten, die sie bearbeitet haben
- Kein Zugriff auf sensible Metadaten anderer Benutzer
- IP-Adressen werden maskiert

### Supplier / Contributor
- Read-only Zugriff nur auf ihre eigenen beigetragenen Daten
- Auf Felder, Sektionen oder Materialien beschränkt, für die sie verantwortlich sind
- IP-Adressen werden maskiert

### Free / Trial Users
- Kein Zugriff oder beschränkt auf letzte 7 Tage
- Read-only

## API Endpoints

### GET /api/audit-logs

Holt Audit Logs mit Filterung und Pagination.

**Query Parameters:**
- `organizationId` (optional): Filter nach Organisation
- `dppId` (optional): Filter nach DPP
- `startDate` (optional): Startdatum (ISO 8601)
- `endDate` (optional): Enddatum (ISO 8601)
- `entityType` (optional): Filter nach Entity-Typ
- `actionType` (optional): Filter nach Action-Typ
- `actorId` (optional): Filter nach Actor
- `source` (optional): Filter nach Quelle (UI | API | AI | SYSTEM)
- `complianceOnly` (optional): Nur Compliance-relevante Logs
- `includeAIEvents` (optional): AI-Events einbeziehen (default: true)
- `page` (optional): Seitennummer (default: 1)
- `limit` (optional): Anzahl pro Seite (default: 50, max: 200)
- `export` (optional): Export-Format ("csv" | "json")

**Response:**
```json
{
  "logs": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  }
}
```

### GET /api/audit-logs/[logId]

Holt einen einzelnen Audit Log Eintrag mit vollständigen Details.

## UI Komponenten

### Audit Log Page
- **Route**: `/app/audit-logs`
- **Zugriff**: Organization Admin, Organization Member
- **Features**:
  - Filter-Bar (sticky)
  - Tabellenansicht mit Pagination
  - Detail-Drawer für einzelne Einträge
  - Export (CSV / JSON)

### DPP-Level Audit Log
- **Route**: `/app/dpp/[dppId]/audit` (zu implementieren)
- **Zugriff**: DPP-spezifische Berechtigungen
- **Features**: Gleiche Features wie Organization-Level, aber auf DPP beschränkt

## Integration

### Beispiel: DPP Update loggen

```typescript
import { logDppAction, ACTION_TYPES, SOURCES } from "@/lib/audit/audit-service"
import { getOrganizationRole } from "@/lib/permissions"

// In PUT /api/app/dpp/[dppId]
const role = await getOrganizationRole(userId, organizationId)

await logDppAction(ACTION_TYPES.UPDATE, dppId, {
  actorId: userId,
  actorRole: role || undefined,
  organizationId,
  fieldName: "materials",
  oldValue: oldMaterials,
  newValue: newMaterials,
  source: SOURCES.UI,
  complianceRelevant: true, // materials ist compliance-relevant
  ipAddress: request.headers.get("x-forwarded-for") || undefined,
})
```

### Beispiel: AI Suggestion loggen

```typescript
import { logAIAction, ACTION_TYPES, ENTITY_TYPES } from "@/lib/audit/audit-service"

await logAIAction(
  ACTION_TYPES.AI_SUGGESTION_ACCEPTED,
  ENTITY_TYPES.DPP,
  dppId,
  {
    aiModel: "gpt-4",
    aiModelVersion: "2024-01-01",
    aiPromptId: "prompt-123",
    aiInputSources: ["dpp-content", "template"],
    aiConfidenceScore: 0.85,
    aiExplainabilityNote: "Based on similar products in category",
    humanInTheLoop: true, // Required for compliance-relevant
    finalDecisionBy: userId,
    regulatoryImpact: "medium",
  },
  {
    actorId: userId,
    organizationId,
    fieldName: "materials",
    oldValue: oldValue,
    newValue: newValue,
    complianceRelevant: true,
  }
)
```

## Governance Rules

1. **AI darf niemals direkt Compliance-relevante Felder überschreiben**
2. **Jeder akzeptierte oder modifizierte AI-Vorschlag erstellt einen separaten Audit Log Eintrag**
3. **complianceRelevant = true erfordert humanInTheLoop = true für AI-Aktionen**
4. **IP-Adressen werden für nicht-Admin-Rollen maskiert**
5. **Interne System-Events werden niemals an Kunden weitergegeben**
6. **Roh-AI-Prompts werden niemals gespeichert oder angezeigt (nur Prompt-IDs)**

## Migration

Um das Audit System zu aktivieren:

1. **Prisma Schema aktualisieren:**
```bash
npx prisma generate
npx prisma db push
```

2. **Audit Logging in bestehende Operationen integrieren:**
   - Siehe `src/lib/audit/INTEGRATION_EXAMPLE.ts` für Beispiele
   - Integriere `logDppAction`, `logAIAction`, `logSystemAction` in API Routes

3. **UI-Zugriff konfigurieren:**
   - Audit Log Page ist bereits unter `/app/audit-logs` verfügbar
   - DPP-Level Audit Log kann unter `/app/dpp/[dppId]/audit` hinzugefügt werden

## Best Practices

1. **Logge alle Compliance-relevanten Änderungen**: Materialien, Konformitätserklärungen, etc.
2. **Logge alle AI-Aktionen**: Jede AI-Interaktion sollte geloggt werden
3. **Verwende aussagekräftige Field-Namen**: Erleichtert die Nachverfolgung
4. **Setze complianceRelevant korrekt**: Nur für ESPR-relevante Felder
5. **IP-Adressen nur bei Bedarf loggen**: Datenschutz beachten
6. **Metadaten sparsam verwenden**: Nur relevante Informationen speichern

## Performance

- **Indizierung**: Alle wichtigen Felder sind indiziert
- **Pagination**: Server-seitige Pagination für große Datenmengen
- **Filterung**: Effiziente Datenbankabfragen mit Prisma
- **Export**: Server-seitige Generierung, keine Client-Manipulation

## Sicherheit

- **Immutable**: Logs können nicht geändert oder gelöscht werden
- **Rollenbasierte Zugriffskontrolle**: Strikte Organisation-Scoping
- **IP-Masking**: Automatisches Maskieren für nicht-Admin-Rollen
- **Keine Roh-Prompts**: Nur Prompt-IDs werden gespeichert
- **Keine System-Events für Kunden**: Interne Events bleiben intern


