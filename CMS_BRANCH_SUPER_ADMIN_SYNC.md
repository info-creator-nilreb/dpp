# Super-Admin auf Produktionsstand bringen (CMS-Branch)

Ziel: **Editorial-Frontend und CMS-Änderungen behalten**, **Super-Admin exakt wie in Produktion (main)**.

---

## Sinnvoller Ablauf

### 1. Änderungen sichern (CMS/Editorial geht nicht verloren)

Alle aktuellen Änderungen sind entweder schon im Branch oder werden explizit behalten.

**Option A – Alles committen (empfohlen)**  
Damit ist der aktuelle Stand (inkl. CMS/Editorial) festgehalten:

```bash
git add -A
git status   # Prüfen: nur gewollte Dateien
git commit -m "WIP: CMS/Editorial + Pflichtdaten, Supplier-Invites, Content-API"
```

**Option B – Nur CMS/Editorial sichern, Rest verwerfen**  
Wenn du nur bestimmte Bereiche behalten willst, zuerst einen Sicherungsbranch anlegen:

```bash
git checkout -b CMS-editorial-backup
git add -A && git commit -m "Backup vor Super-Admin-Sync"
git checkout CMS
```

---

### 2. Super-Admin + Abhängigkeiten von Produktion (main) holen

Damit wird **nur** der Super-Admin-Bereich (und eine zentrale Abhängigkeit) auf den Stand von **main** gesetzt. Alles andere (Editorial, CMS, App, etc.) bleibt unverändert.

```bash
git fetch origin main

# Super-Admin komplett von main
git checkout origin/main -- src/app/super-admin

# Abhängigkeit: Password-Protection (existiert auf main, wird von Settings genutzt)
git checkout origin/main -- src/lib/password-protection.ts
```

Ergebnis:

- `src/app/super-admin/*` = Stand von **main** (Produktion).
- `src/lib/password-protection.ts` = Stand von **main** (kein „Module not found“ mehr).
- Alle übrigen Änderungen (Editorial, CMS, DPP-Editor, APIs, etc.) bleiben wie vorher.

---

### 3. Logo: EasyPass überall (optional)

Auf **main** nutzt der Super-Admin aktuell **TPassLogo**. Wenn du überall **EasyPassLogo** aus dem gemeinsamen Ordner willst:

- In **Sidebar**, **Login**, **Forgot-Password**: `TPassLogo` durch `EasyPassLogo` aus `@/components/EasyPassLogo` ersetzen (wie zuvor besprochen).
- Datei `src/app/super-admin/components/TPassLogo.tsx` kannst du danach löschen, sobald nirgends mehr referenziert.

(Diese Anpassungen sind rein optisch und unabhängig vom „Produktionsstand clonen“.)

---

### 4. Commit nach dem Sync

```bash
git status   # Prüfen: geänderte Dateien nur unter super-admin + ggf. password-protection
git add src/app/super-admin src/lib/password-protection.ts
git commit -m "chore: Super-Admin und password-protection auf Produktionsstand (main) gesetzt"
```

---

## Kurzüberblick

| Aktion                         | Befehl / Inhalt                                                                 |
|--------------------------------|----------------------------------------------------------------------------------|
| CMS/Editorial sichern          | `git add -A` + `git commit` **vor** Schritt 2                                   |
| Super-Admin = Produktion       | `git checkout origin/main -- src/app/super-admin`                               |
| Password-Protection (Settings) | `git checkout origin/main -- src/lib/password-protection.ts`                    |
| Optional: EasyPass statt TPass | In Sidebar/Login/Forgot-Password `EasyPassLogo` aus `@/components/EasyPassLogo` |

Damit hast du:

- **Lokal (CMS-Branch):** aktueller Editorial- und CMS-Stand **plus** Super-Admin und password-protection wie in **Produktion (main)**.
- Kein Überschreiben von Editorial-Frontend oder CMS-Code; nur Super-Admin und eine Lib werden gezielt von main übernommen.

---

## Warum es Abweichungen gab

- **Produktion (Vercel)** baut aus **main** → Super-Admin und alle Libs (z. B. `password-protection`) kommen von dort.
- **Lokal** lief der **CMS-Branch** → Super-Admin war teils älter oder anders angepasst, und `password-protection` fehlte oder war anders.
- Mit dem gezielten `git checkout origin/main -- src/app/super-admin` und `-- src/lib/password-protection.ts` gleicht du nur diese Bereiche an main an und behältst den Rest (Editorial, CMS) bei.
