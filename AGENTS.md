# 🤖 Verbindliche Anweisungen für alle KI-Modelle & Agenten (Barrierefreier Dokumenten-Betrachter Android)
<!-- Gilt für alle KI-Assistenten: OpenAI (ChatGPT/Codex), Anthropic (Claude Code), Google (Gemini/Antigravity), GitHub Copilot, Cursor, Windsurf -->

Dieses Dokument definiert die **verbindlichen Regeln, Pflichten und Verbote** für jedes KI-Modell und jeden Agenten, der in diesem Repository arbeitet.

---

## 🚫 1. Was KI-Modelle STRIKT NICHT TUN DÜRFEN (DON'TS / VERBOTE)

1. ❌ **KEINE manuellen Versionsnummern ändern:**
   - Ändere NIEMALS manuell Versionsnummern in `build.gradle` (`versionCode`/`versionName`), `package.json`, `app.js` oder HTML-Dateien!
   - ℹ️ GitHub Actions CI/CD (`build-apk.yml`) erhöht die Versionsnummern und synchronisiert alle Stellen im gesamten Projekt bei jedem Push auf `main` **vollautomatisch**.
2. ❌ **KEINE manuellen GitHub Releases oder Git-Tags anlegen:**
   - Erstelle niemals manuell Tags wie `v1.x.x` oder Releases über Git/CLI. GitHub Actions kompiliert, taggt und veröffentlicht APK-Releases automatisch.
3. ❌ **KEINE privaten Daten des Autors veröffentlichen:**
   - Der Entwickler ist **Laurin Schneider**. Es dürfen **NIEMALS** private Anschriften, Wohnadressen, Telefonnummern oder vertrauliche persönliche Angaben in Code, Commits, Dokumentation oder Issues hinterlegt werden (strikter Schutz der Privatsphäre!).
4. ❌ **KEINE bestehenden Benutzerdaten oder Dokumenten-Parser beschädigen:**
   - Niemals gespeicherte Einstellungen, Lesezeichen, Lesepositionen oder Parser-Kompatibilität für bestehende Formate (ODT, DOCX, PDF, ODS, TXT) löschen oder inkompatibel umbauen.
   - 100% Abwärtskompatibilität ist zwingend vorgeschrieben.
5. ❌ **KEINE unzugänglichen UI-Elemente bauen:**
   - Niemals klickbare Elemente ohne Tastatur-Fokus (`tabindex="0"`), ohne `role="button"` oder ohne aussagekräftiges `aria-label` verwenden.
   - Niemals reine Maus-Hover-Interaktionen ohne Tastaturalternative einbauen.
6. ❌ **KEINE Canvas-Only / Bitmap-Only Render-Ergebnisse ohne Text-Ebene:**
   - Dokumente MÜSSEN immer als semantische, für TalkBack lesbare HTML-Strukturen (`<h1>`-`<h6>`, `<p>`, `<table>`, `<ul>`, `<li>`) ausgegeben werden. Reine Pixel-Renderings ohne Textstruktur sind für Screenreader unbrauchbar und strengstens verboten.

---

## ✅ 2. Was KI-Modelle TUN MÜSSEN (DO'S & PFLICHTEN)

1. 📝 **Aussagekräftige Commit-Nachrichten für das automatische Änderungsprotokoll:**
   - Deine Commit-Nachricht wird von GitHub Actions **vollautomatisch als offizielles Release-Änderungsprotokoll (Changelog)** auf GitHub übernommen!
   - Schreibe daher immer verständliche, prägnante Commit-Nachrichten (nach Conventional Commits):
     - `feat: ODT Tabellen-Unterstützung für Screenreader hinzugefügt` (für neue Funktionen)
     - `fix: Fehler bei TalkBack-Ansage im Lesemodus behoben` (für Fehlerbehebungen)
     - `perf: Schnelleres Laden von großen DOCX-Dateien` (für Optimierungen)
2. ♿ **100% Barrierefreiheit (WCAG 2.2 AAA & Screenreader-Fokus):**
   - Zielgruppe: Blinde und sehbehinderte Menschen mit Google TalkBack und Tastatursteuerung.
   - Jedes UI-Element muss vollständig ohne Maus per Tastatur (`Tab`, `Enter`, `Leertaste`, Pfeiltasten) erreichbar und bedienbar sein.
   - Alle Statusänderungen, Dialoge, Ladevorgänge und Fehler MÜSSEN über `aria-live="polite"` oder `aria-live="assertive"` an den Screenreader gemeldet werden.
   - Hohe Kontraste, anpassbare Schriftgrößen (von 14px bis 36px), Gelb-auf-Schwarz-Modus und Dunkelmodus.
3. 🚀 **Sauberer Git-Workflow:**
   - Entwickle Änderungen am Code normal und pushe sie auf den Branch `main`.
   - Bei reinen Dokumentations-Commits (die keinen Build oder Release erfordern) immer `[skip ci]` in die Commit-Message schreiben.
4. 💾 **Lokale Datenhaltung & Offline-First:**
   - Alle Dokumenten-Parser laufen 100% lokal auf dem Gerät. Keine Datei verlässt das Smartphone! Absoluter Datenschutz.

---

## ⚙️ 3. Technische Projektdaten

- **Projekttyp:** Barrierefreier Dokumenten-Betrachter für Android (LibreOffice ODT, Word DOCX, PDF, ODS, XLSX, TXT)
- **Paket-ID:** `de.lauri.dokumentenbetrachter`
- **Plattformen & Build:** Android APK (Gradle Debug & Release via GitHub Actions ubuntu-latest)
- **Wichtige Kerndateien:** `www/index.html, www/style.css, www/app.js, android/app/build.gradle, package.json`
- **CI/CD Pipeline:** Befindet sich unter `.github/workflows/build-apk.yml`.
