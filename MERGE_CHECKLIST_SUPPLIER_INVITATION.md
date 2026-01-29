# Merge-Checkliste: supplierinvitation → main

## 📋 Übersicht

**Branch:** `supplierinvitation` → `main`  
**Datum:** $(date +%Y-%m-%d)  
**Ziel:** Sauberer Merge für Vercel Deployment

---

## ⚠️ WICHTIG: Merge-Konflikte vorhanden

Es wurden **4 Dateien mit Konflikten** identifiziert:
1. `src/components/DppEditor.tsx`
2. `src/components/SupplierInviteModal.tsx`
3. `src/components/TemplateBlockField.tsx`
4. `src/components/TemplateBlocksSection.tsx`

---

## ✅ Pre-Merge Checkliste

### 1. Code-Änderungen prüfen

#### Neue Dateien:
- ✅ `src/app/api/app/dpp/[dppId]/data-requests/send-pending/route.ts` - Neuer API-Endpunkt für pending invites

#### Geänderte Dateien:
- ✅ `src/components/DppEditor.tsx` - **KONFLIKT**
- ✅ `src/components/SupplierInviteModal.tsx` - **KONFLIKT**
- ✅ `src/components/TemplateBlockField.tsx` - **KONFLIKT**
- ✅ `src/components/TemplateBlocksSection.tsx` - **KONFLIKT**
- ✅ `src/components/DppMediaSection.tsx` - Kein Konflikt erwartet

### 2. Datenbank-Migrationen

#### ✅ Keine neuen Migrationen erforderlich

**Status:** Die Schema-Änderungen für `supplierMode` und `fieldInstances` sind bereits in `main` vorhanden:
- `ContributorToken.supplierMode` (String?, "input" | "declaration")
- `ContributorToken.fieldInstances` (via JSON)
- `DppBlockSupplierConfig.mode` (String?, "input" | "declaration")

**Bestehende Migrationen, die bereits in main sind:**
- `20260108222548_move_supplier_config_to_dpp` - Supplier Config zu DPP verschoben
- `20260111000000_add_repeatable_fields` - Repeatable Fields
- `20260112000000_add_template_version_binding` - Template Version Binding

**Aktion:** Keine Migrationen erforderlich ✅

### 3. Abhängigkeiten

#### ✅ Keine neuen Dependencies

**Prüfung:**
- Keine neuen `package.json` Änderungen im supplierinvitation Branch
- Alle verwendeten Packages sind bereits in `main` vorhanden

---

## 🔧 Merge-Schritte

### Schritt 1: Vorbereitung

```bash
# 1. Aktuellen Stand von main holen
git checkout main
git pull origin main

# 2. Supplierinvitation Branch aktualisieren (falls nötig)
git checkout supplierinvitation
git pull origin supplierinvitation

# 3. Zurück zu main
git checkout main
```

### Schritt 2: Merge durchführen

```bash
# Merge starten (ohne Auto-Commit)
git merge --no-commit --no-ff supplierinvitation
```

### Schritt 3: Konflikte lösen

#### Konflikt 1: `src/components/DppEditor.tsx`

**Erwartete Konfliktbereiche:**
- `supplierFieldInfo` Logik (mode: "input" | "declaration")
- `onSendPendingInvites` Handler
- `getPartnerRoleLabel` Funktion

**Lösungsstrategie:**
1. Prüfe beide Versionen (main vs supplierinvitation)
2. Behalte die supplierinvitation-Version für supplier-spezifische Logik
3. Integriere Änderungen aus main für andere Features
4. Stelle sicher, dass `supplierFieldInfo.mode` korrekt gesetzt wird

#### Konflikt 2: `src/components/SupplierInviteModal.tsx`

**Erwartete Konfliktbereiche:**
- `hasAvailableFieldsForMode` Funktion
- `getAssignedSupplierForContribute` Funktion
- `useEffect` für Modal-Initialisierung
- `canUseContributeMode` / `canUseReviewMode` Logik

**Lösungsstrategie:**
1. Behalte die vollständige supplierinvitation-Version
2. Diese Datei wurde umfangreich überarbeitet und sollte als Ganzes übernommen werden
3. Prüfe, ob es neue Props oder Callbacks gibt, die in DppEditor integriert werden müssen

#### Konflikt 3: `src/components/TemplateBlockField.tsx`

**Erwartete Konfliktbereiche:**
- `supplierInfo` Rendering (mode: "input" | "declaration")
- Label-Layout (flex für inline supplier hints)
- Media Upload Visibility (readOnly handling)
- "Kein Bild/Dokument/Video hochgeladen" Hints

**Lösungsstrategie:**
1. Behalte supplierinvitation-Version für supplier-spezifische Features
2. Integriere andere Änderungen aus main (falls vorhanden)
3. Stelle sicher, dass `readOnly` korrekt behandelt wird

#### Konflikt 4: `src/components/TemplateBlocksSection.tsx`

**Erwartete Konfliktbereiche:**
- `supplierFieldInfo` Prop Type (mit `mode` Feld)
- `onSupplierInfoConfirm` Callback

**Lösungsstrategie:**
1. Aktualisiere Type-Definitionen für `supplierFieldInfo`:
   ```typescript
   supplierFieldInfo: Record<string, { 
     partnerRole: string; 
     confirmed?: boolean; 
     mode?: "input" | "declaration" 
   }>
   ```
2. Stelle sicher, dass alle Props korrekt weitergegeben werden

### Schritt 4: Nach Konfliktlösung

```bash
# 1. Alle Dateien stagen
git add .

# 2. Prüfe Status
git status

# 3. Commit erstellen
git commit -m "Merge supplierinvitation into main

- Supplier invitation modal mit declaration/review mode
- Neue API-Route für pending invites
- TemplateBlockField: Read-only mode für declaration
- Supplier info hints inline mit Feldnamen
- Modal öffnet direkt bei Schritt 5, wenn keine Felder verfügbar"

# 4. Prüfe, ob alles kompiliert
npm run build
```

### Schritt 5: Tests

#### Lokale Tests:
```bash
# 1. Development Server starten
npm run dev

# 2. Manuelle Tests:
- ✅ Supplier Invitation Modal öffnen
- ✅ Declaration mode testen (read-only)
- ✅ Pending invites versenden
- ✅ TemplateBlockField mit supplier info
- ✅ Media upload in read-only mode
```

#### Build-Test:
```bash
# Production Build testen
npm run build
```

---

## 🚀 Deployment-Checkliste (Vercel)

### Pre-Deployment:

- [ ] Alle Merge-Konflikte gelöst
- [ ] Build erfolgreich (`npm run build`)
- [ ] Keine TypeScript-Fehler
- [ ] Keine Linter-Fehler (`npm run lint`)
- [ ] Lokale Tests erfolgreich

### Vercel Deployment:

- [ ] **Keine DB-Migrationen erforderlich** ✅
- [ ] Environment Variables prüfen (falls neue benötigt werden)
- [ ] Deployment in Vercel Dashboard starten
- [ ] Deployment-Logs prüfen
- [ ] Post-Deployment Tests:
  - [ ] Supplier Invitation Modal funktioniert
  - [ ] Declaration mode funktioniert (read-only)
  - [ ] Pending invites können versendet werden
  - [ ] Supplier info hints werden angezeigt

---

## 📝 Wichtige Hinweise

### 1. Keine Breaking Changes
- Alle Änderungen sind rückwärtskompatibel
- Bestehende ContributorTokens funktionieren weiterhin
- Schema-Änderungen sind bereits in main

### 2. Neue Features
- **Declaration Mode**: Felder können jetzt für "Prüfung" (declaration) zugewiesen werden
- **Pending Invites**: API-Endpunkt zum Versenden von E-Mails für pending invites
- **Read-Only Mode**: TemplateBlockField unterstützt jetzt read-only für declaration mode
- **Inline Hints**: Supplier info hints erscheinen inline mit Feldnamen

### 3. API-Änderungen
- **Neuer Endpunkt**: `POST /api/app/dpp/[dppId]/data-requests/send-pending`
  - Sendet E-Mails für alle pending invites
  - Aktualisiert `emailSentAt` Timestamp

---

## 🔍 Rollback-Plan

Falls Probleme auftreten:

```bash
# 1. Zu vorherigem Commit zurückkehren
git checkout main
git reset --hard <commit-before-merge>

# 2. Force Push (nur wenn nötig und nach Absprache)
git push origin main --force
```

**Wichtig:** Rollback ist unkritisch, da keine DB-Migrationen durchgeführt wurden.

---

## ✅ Finale Checkliste vor Merge

- [ ] Alle Konflikte gelöst
- [ ] Code kompiliert ohne Fehler
- [ ] Tests lokal durchgeführt
- [ ] Keine DB-Migrationen erforderlich ✅
- [ ] Commit-Message erstellt
- [ ] Bereit für Push zu main

---

## 📞 Support

Bei Fragen oder Problemen:
1. Prüfe die Konflikt-Marker in den betroffenen Dateien
2. Vergleiche beide Versionen (main vs supplierinvitation)
3. Teste lokal nach Konfliktlösung
4. Prüfe Build-Logs in Vercel

---

**Erstellt:** $(date +%Y-%m-%d)  
**Status:** ⚠️ Konflikte müssen gelöst werden
