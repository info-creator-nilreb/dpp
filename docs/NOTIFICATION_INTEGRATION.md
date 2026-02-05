# Benachrichtigungen – Konkrete Integrationsstellen

Alle Event-Typen sind in `src/lib/notifications/event-types.ts` definiert. Hier die **konkreten Stellen**, an denen die jeweiligen Typen ausgelöst werden sollen (bzw. bereits integriert sind).

---

## Bereits integriert

| Typ | Datei | Stelle |
|-----|--------|--------|
| `supplier_submitted_data` | `src/app/api/contribute/[token]/submit/route.ts` | Nach erfolgreicher Einreichung durch Lieferanten (createNotification) |
| `invitation_accepted` | `src/app/api/app/organization/join-requests/[requestId]/route.ts` | Wenn Join-Request akzeptiert wird |
| `user_removed` | `src/lib/phase1/user-management.ts` | Wenn User aus Organisation entfernt wird |

---

## Integriert in dieser Aufgabe

| Typ | Datei | Stelle |
|-----|--------|--------|
| `dpp_published` | `src/app/api/app/dpp/[dppId]/publish/route.ts` | Nach erfolgreicher Veröffentlichung (nach Audit-Log), Benachrichtigung an den handelnden User mit `targetRoute: /app/dpps/[dppId]`, `targetEntityId: dppId` |
| `import_finished_success` | `src/app/api/app/dpps/import/route.ts` | Direkt vor `return NextResponse.json({ success: true, ... })` nach erfolgreicher Transaktion |
| `import_finished_error` | `src/app/api/app/dpps/import/route.ts` | Im `catch`-Block, Benachrichtigung an den eingeloggten User |
| `subscription_limit_reached` | `src/app/api/app/dpp/[dppId]/publish/route.ts` | Wenn `canPublishDpp` Limit überschritten meldet (vor dem `return NextResponse.json(..., 403)`), Benachrichtigung mit `targetRoute: /app/organization/billing`, `organisationId` |

---

## Weitere vorgeschlagene Stellen (noch nicht umgesetzt)

| Typ | Konkrete Stelle | Hinweis |
|-----|------------------|--------|
| `dpp_created` | `src/app/api/app/dpp/route.ts` – nach `prisma.dpp.create(...)` (ca. Zeile 354), vor dem Response | Optional: nur wenn gewünscht, dass „Ein neuer Produktpass wurde erstellt“ in der Glocke erscheint (z. B. für andere Org-Mitglieder oder den Ersteller). |
| `new_dpp_version_available` | `src/app/api/app/dpp/[dppId]/publish/route.ts` – nach erfolgreicher Veröffentlichung | Für **andere** Org-Mitglieder (nicht den Veröffentlichenden): z. B. alle Mitglieder der DPP-Organisation benachrichtigen, damit sie „Eine neue Version des Produktpasses ist verfügbar“ sehen. Dafür: Mitglieder der `dpp.organizationId` laden und für jede/n `createNotificationWithPayload(..., "new_dpp_version_available", { targetRoute, targetEntityId: dppId })` aufrufen (den aktuellen User auslassen). |
| `dpp_validation_failed` | Wo immer DPP-Validierung fehlschlägt (z. B. vor Veröffentlichung oder bei Speichern) | Noch kein zentraler Validierungs-Endpunkt gefunden; sobald es einen gibt, dort bei Fehler Benachrichtigung erstellen. |
| `audit_relevant_change_detected` | `src/lib/audit/` – bei Einträgen, die als „compliance-relevant“ geloggt werden | Optional: bei `logDppAction` mit `complianceRelevant: true` zusätzlich Benachrichtigung an Org-Admins oder verantwortliche Rolle. |
| `organisation_invitation_received` | Nach dem Versand einer Org-Einladung (z. B. Einladungs-API) | Einladungsempfänger per `createNotificationWithPayload(userId, "organisation_invitation_received", { targetRoute: "/app/organization/users" })`. |
| `organisation_invitation_accepted` | Evtl. zusammen mit bestehendem `invitation_accepted` oder bei separater „Organisation“-Einladung nutzen | Siehe `invitation_accepted` in join-requests. |
| `role_changed` | Beim Ändern der Organisationsrolle eines Users (z. B. in User-/Org-Verwaltung) | Nach erfolgreichem Update der Rolle für den betroffenen User `createNotificationWithPayload(userId, "role_changed", { targetRoute: "/app/organization" })`. |
| `data_confirmed_by_role` | Nach Bestätigung von Lieferantendaten durch eine Rolle (z. B. Redaktion/Qualität) | In der API, die „Daten bestätigen“ abbildet, nach Erfolg mit `targetRoute`/`targetEntityId` zum DPP. |
| `subscription_warning` | Geplante Ablauf-Prüfung (Cron/Job) oder beim Abruf der Subscription | Wenn Abo z. B. in X Tagen abläuft: für Org-Admins `createNotificationWithPayload(..., "subscription_warning", { targetRoute: "/app/organization/billing" })`. |
| `user_invited` | Nach dem Anlegen/Versand einer User-Einladung | Für den eingeladenen User oder für Admins, je nach Produktlogik. |
| `organization_updated` | Nach Update von Organisationsstammdaten (Name, etc.) | In der entsprechenden PATCH/PUT-Route der Organisation, für alle Org-Mitglieder oder nur Admins. |
| `join_request` | Bereits vorhanden: `src/app/api/app/organization/join-requests/route.ts` (notifyOrgAdmins) | Prüfen, ob dort `createNotification(..., "join_request", ...)` für Admins aufgerufen wird; wenn nicht, dort ergänzen. |

---

## Verwendung

- **Legacy (nur Typ + Referenz):** `createNotification(userId, type, referenceType?, referenceId?)`  
  aus `@/lib/phase1/notifications`.
- **Mit Deep-Link und optionalem Text:** `createNotificationWithPayload(userId, type, payload?, referenceType?, referenceId?)`  
  Payload: `targetRoute`, `targetEntityId`, `targetTab`, `messageOverride`, `organisationId`, `actorRole` etc. (siehe `NotificationEventPayload` in `event-types.ts`).
