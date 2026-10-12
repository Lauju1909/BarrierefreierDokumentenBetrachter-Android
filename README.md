# 📄 Barrierefreier Dokumenten-Betrachter (Android)

Ein hochgradig barrierefreier, offline-fähiger Dokumenten-Betrachter für Android, speziell entwickelt für blinde und sehbehinderte Menschen mit vollem Fokus auf **Google TalkBack**, Braillezeilen und **WCAG 2.2 AAA** Barrierefreiheit.

---

## 🌟 Warum diese App?

Herkömmliche Office-Viewer (wie der offizielle LibreOffice Viewer oder viele PDF-Apps) rendern Dokumente als reine Grafik-Kacheln auf einer Canvas-Leinwand. Für Screenreader wie **TalkBack** ist der Inhalt unsichtbar – blinde Nutzer hören nur „Grafik“ oder gar nichts.

Der **Barrierefreie Dokumenten-Betrachter** löst dieses Problem fundamental:
* Er wandelt alle Dokumente in **echte, semantische Textstrukturen** (`<h1>`-`<h6>`, `<p>`, `<table>`, `<ul>`, `<li>`) um.
* TalkBack kann jeden Absatz, jede Überschrift und jede Tabelle strukturiert vorlesen und ansteuern.
* Mit integrierter **Vorlesefunktion (Text-to-Speech)**, stufenlosem **Großschriftmodus** und **hohen Kontrasten** (Gelb auf Schwarz, OLED-Schwarz, Weiß).

---

## 📂 Unterstützte Dateiformate

* **LibreOffice / OpenOffice Writer:** `.odt`
* **Microsoft Word:** `.docx`, `.doc`
* **LibreOffice Calc / Microsoft Excel:** `.ods`, `.xlsx`
* **Adobe PDF:** `.pdf`
* **Text & Code:** `.txt`, `.rtf`, `.md`, `.csv`, `.log`

---

## ♿ Barrierefreiheits-Features (WCAG 2.2 AAA)

* **100% TalkBack-optimiert:** Alle Steuerelemente verfügen über eindeutige Labels, ARIA-Rollen und Live-Regionen.
* **Integrierte Vorlesefunktion (TTS):** Liest das gesamte Dokument satzweise vor – mit Play, Pause, Vor und Zurück sowie visueller Hervorhebung.
* **Inhaltsverzeichnis / Kapitel-Navigation:** Springe blitzschnell zwischen Überschriften hin und her.
* **Hohe Kontraste:** 4 barrierefreie Farbmodi (Hell, OLED-Dunkel, Gelb auf Schwarz, Sepia/Augenschonend).
* **Schriftgrößen-Zoom:** Stufenlose Skalierung von 14px bis 36px Schriftgröße sowie anpassbarer Zeilenabstand.
* **Vollständige Tastaturbedienung:** Unterstützt Bluetooth-Tastaturen, Braillezeilen und externe Eingabegeräte.
* **100% Offline & Datenschutz:** Keine Cloud, kein Server-Upload, kein Tracking. Alle Dokumente bleiben sicher auf deinem Gerät.

---

## 🛠️ Entwicklung & Build

Entwickelt mit HTML5, CSS3, JavaScript und Capacitor für Android.

```bash
# Abhängigkeiten installieren
npm install

# Android-Sync ausführen
npx cap sync android

# Android Studio öffnen
npx cap open android
```

---

## 📜 Lizenz & Autor

* **Autor:** Laurin Schneider
* **Lizenz:** MIT
