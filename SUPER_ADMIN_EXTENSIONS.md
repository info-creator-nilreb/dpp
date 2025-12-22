# Super Admin Dashboard Extensions

## Übersicht

Erweiterungen für das Super Admin Dashboard mit vollständiger Isolation von Tenant-Systemen.

## Architektur-Entscheidungen

### 1. Isolation
- ✅ Alle API Routes unter `/api/super-admin/*`
- ✅ Separate Guards und Permission Checks
- ✅ Keine Wiederverwendung von Tenant-Logik
- ✅ Eigene Audit-Logging für alle Aktionen

### 2. Soft Deletes
- ✅ Keine hard deletes
- ✅ Status-basierte Deaktivierung (active | suspended | archived)
- ✅ Templates: `isActive` Flag statt Delete

### 3. License Tiers
- ✅ Nicht mit Billing verbunden (logische Tiers)
- ✅ Tiers: `free | basic | premium | pro`
- ✅ In `Organization` Modell als einfaches Feld

### 4. DPP Read-Only Access
- ✅ Nur GET-Endpoints
- ✅ Keine PUT/POST/DELETE für DPPs
- ✅ Vollständige Details mit Organization Context

### 5. Template Versioning
- ✅ Automatische Versionierung bei Schema-Änderungen
- ✅ `name` + `version` Unique Constraint
- ✅ Alte Versionen bleiben erhalten

## Schema-Änderungen

### Organization
```prisma
model Organization {
  // ... existing fields
  licenseTier String @default("free") // free | basic | premium | pro
  status      String @default("active") // active | suspended | archived
}
```

### Template
```prisma
model Template {
  // ... existing fields
  category    String?  // TEXTILE | FURNITURE | OTHER
  description String?
  createdBy   String?  // Super Admin ID
}
```

## API Routes

### Organizations
- `GET /api/super-admin/organizations` - Liste mit Filtern
- `POST /api/super-admin/organizations` - Neue Organisation erstellen
- `GET /api/super-admin/organizations/[id]` - Details
- `PUT /api/super-admin/organizations/[id]` - Update
- `POST /api/super-admin/organizations/[id]/members` - Member hinzufügen/update
- `DELETE /api/super-admin/organizations/[id]/members` - Member entfernen

### DPPs (Read-Only)
- ~~`GET /api/super-admin/dpps`~~ - **DEPRECATED/REMOVED**: Super Admin DPPs werden jetzt ausschließlich über Server Components geladen
- ~~`GET /api/super-admin/dpps/[id]`~~ - **DEPRECATED/REMOVED**: Super Admin DPPs werden jetzt ausschließlich über Server Components geladen

### Templates
- `GET /api/super-admin/templates` - Liste mit Filtern
- `POST /api/super-admin/templates` - Neues Template erstellen
- `GET /api/super-admin/templates/[id]` - Details
- `PUT /api/super-admin/templates/[id]` - Update (erstellt Version bei Schema-Änderung)
- `DELETE /api/super-admin/templates/[id]` - Soft Delete (deaktiviert)

### Audit Logs
- `GET /api/super-admin/audit-logs` - Liste mit Filtern

## Permission Matrix

| Action | super_admin | support_admin | read_only_admin |
|--------|-------------|---------------|-----------------|
| Organization (read) | ✅ | ✅ | ✅ |
| Organization (update) | ✅ | ✅ | ❌ |
| DPP (read) | ✅ | ✅ | ✅ |
| Template (read) | ✅ | ✅ | ✅ |
| Template (update) | ✅ | ✅ | ❌ |
| Audit Logs (read) | ✅ | ✅ | ✅ |

## Audit Logging

Alle Aktionen werden automatisch geloggt:
- `organization.create`, `organization.update`, `organization.suspend`
- `organization.member.add`, `organization.member.update`, `organization.member.remove`
- `template.create`, `template.update`, `template.deactivate`
- `license.tier.change` (wenn implementiert)

## Nächste Schritte (UI Implementation)

Die API Routes sind vollständig implementiert. UI-Seiten müssen noch erstellt werden:

1. **Organizations Management UI**
   - Liste mit Filter (Status, License Tier)
   - Detail-Seite mit Edit-Formular
   - Member-Management UI

2. **DPPs Read-Only UI**
   - Liste mit Suche/Filter
   - Detail-Ansicht (Read-Only)

3. **Templates Management UI**
   - Liste mit Filter
   - Create/Edit-Formular
   - Version-Historie

4. **Audit Logs UI**
   - Liste mit erweiterten Filtern
   - Detail-Ansicht mit Before/After Diff

## Testing Checklist

- [ ] Organization CRUD funktioniert
- [ ] Member Management funktioniert
- [ ] License Tiers können geändert werden
- [ ] DPPs sind read-only
- [ ] Templates können erstellt/geändert werden
- [ ] Template Versioning funktioniert
- [ ] Audit Logs werden korrekt erstellt
- [ ] Permissions werden korrekt enforced

