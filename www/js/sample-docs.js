/**
 * SampleDocs - Erzeugt barrierefreie Beispieldokumente direkt im Speicher
 * Ermöglicht sofortiges Ausprobieren aller Formate ohne externe Dateien.
 */
const SampleDocs = (function () {
    'use strict';

    function createSampleOdtBlob() {
        if (typeof JSZip === 'undefined') {
            return Promise.reject(new Error('JSZip nicht geladen'));
        }

        const zip = new JSZip();
        zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' });
        
        const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;
        zip.file('META-INF/manifest.xml', manifestXml);

        const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" 
                         xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" 
                         xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" 
                         office:version="1.2">
  <office:body>
    <office:text>
      <text:h text:outline-level="1">Willkommen bei LibreOffice Writer (Barrierefrei)</text:h>
      <text:p>Dies ist ein echtes OpenDocument-Textdokument (.odt). Alle Absätze, Überschriften und Tabellen werden in sauberes, semantisches HTML übersetzt, damit Google TalkBack und Braillezeilen das Dokument mühelos lesen können.</text:p>
      
      <text:h text:outline-level="2">1. Barrierefreiheit im Fokus</text:h>
      <text:p>Traditionelle Office-Viewer rendern Dokumente als Grafik-Pixel. Blinde Menschen hören bei diesen Apps oft gar nichts. In dieser App ist jeder Satz ein navigierbares Textelement.</text:p>
      <text:list>
        <text:list-item><text:p>Vollständige TalkBack-Unterstützung (WCAG 2.2 AAA)</text:p></text:list-item>
        <text:list-item><text:p>Integrierte Sprachausgabe mit Satzhervorhebung</text:p></text:list-item>
        <text:list-item><text:p>Schriftgröße und Farbkontraste stufenlos anpassbar</text:p></text:list-item>
        <text:list-item><text:p>100% offline und sichere lokale Verarbeitung</text:p></text:list-item>
      </text:list>

      <text:h text:outline-level="2">2. Barrierefreie Tabelle</text:h>
      <table:table table:name="Umsatzuebersicht">
        <table:table-row>
          <table:table-cell><text:p>Kategorie</text:p></table:table-cell>
          <table:table-cell><text:p>Format</text:p></table:table-cell>
          <table:table-cell><text:p>Status</text:p></table:table-cell>
        </table:table-row>
        <table:table-row>
          <table:table-cell><text:p>Textdokument</text:p></table:table-cell>
          <table:table-cell><text:p>LibreOffice (.odt)</text:p></table:table-cell>
          <table:table-cell><text:p>100% Barrierefrei</text:p></table:table-cell>
        </table:table-row>
        <table:table-row>
          <table:table-cell><text:p>Textverarbeitung</text:p></table:table-cell>
          <table:table-cell><text:p>Microsoft Word (.docx)</text:p></table:table-cell>
          <table:table-cell><text:p>Voll unterstützt</text:p></table:table-cell>
        </table:table-row>
        <table:table-row>
          <table:table-cell><text:p>Tabellenkalkulation</text:p></table:table-cell>
          <table:table-cell><text:p>Calc / Excel (.ods / .xlsx)</text:p></table:table-cell>
          <table:table-cell><text:p>Strukturierte Ausgabe</text:p></table:table-cell>
        </table:table-row>
      </table:table>

      <text:h text:outline-level="2">3. Fazit</text:h>
      <text:p>Dieses Dokument beweist: Moderne Dokumentenbetrachtung auf Android kann sowohl optisch ansprechend als auch für jeden Screenreader perfekt zugänglich sein.</text:p>
    </office:text>
  </office:body>
</office:document-content>`;
        zip.file('content.xml', contentXml);

        return zip.generateAsync({ type: 'arraybuffer' });
    }

    function createSampleDocxBlob() {
        if (typeof JSZip === 'undefined') {
            return Promise.reject(new Error('JSZip nicht geladen'));
        }

        const zip = new JSZip();
        
        // Minimal valid docx
        const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
        zip.file('_rels/.rels', rels);

        const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
        zip.file('[Content_Types].xml', contentTypes);

        const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>Microsoft Word Dokument (.docx) Test</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Dieses Dokument wurde im modernen Office Open XML Standard (Word .docx) erstellt. Der Mammoth-Parser übersetzt Absätze, Formatierungen und Strukturen barrierefrei in HTML.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:t>Wichtige Vorteile für TalkBack</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Echte HTML-Überschriften und Absätze für blitzschnelles Springen.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Vorlesemodus mit Satznavigation und Geschwindigkeitsregler.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• Vollständige Datensicherheit ohne Internetzugriff.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;
        zip.file('word/document.xml', docXml);

        return zip.generateAsync({ type: 'arraybuffer' });
    }

    function createSampleOdsBlob() {
        if (typeof XLSX === 'undefined') {
            return Promise.reject(new Error('XLSX nicht geladen'));
        }

        const wb = XLSX.utils.book_new();
        const data = [
            ['Monat', 'Einnahmen (€)', 'Ausgaben (€)', 'Sparquote (€)', 'Notiz'],
            ['Januar 2026', 2450.00, 1820.50, 629.50, 'Guter Jahresstart'],
            ['Februar 2026', 2450.00, 1690.00, 760.00, 'Haushaltsbudget eingehalten'],
            ['März 2026', 2550.00, 1780.20, 769.80, 'Sonderzahlung erhalten'],
            ['April 2026', 2450.00, 1910.00, 540.00, 'Reisekosten verbucht'],
            ['Mai 2026', 2450.00, 1650.00, 800.00, 'Sparziel erreicht!']
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Haushaltsbuch');

        const arrayBuffer = XLSX.write(wb, { bookType: 'ods', type: 'array' });
        return Promise.resolve(arrayBuffer);
    }

    function createSampleTextContent() {
        return `# Protokoll: Barrierefreie Softwareentwicklung
Datum: 12. Oktober 2026
Autor: Laurin Schneider

## 1. Ausgangslage
Bestehende Office-Anwendungen auf Android bieten oft unzureichende Unterstützung für Screenreader wie Google TalkBack. 

## 2. Zielsetzung
Entwicklung eines universellen Dokumenten-Betrachters mit folgenden Leitlinien:
- 100% Offline-Betrieb (Keine Cloud-Abhängigkeit)
- Konformität mit WCAG 2.2 AAA
- Hohe Kontraste für Sehbehinderte (Gelb auf Schwarz, OLED-Schwarz)
- Stufenlose Schriftgrößeneinstellung (14px bis 36px)

## 3. Unterstützte Formate
1. LibreOffice Writer (.odt)
2. Microsoft Word (.docx, .doc)
3. LibreOffice Calc (.ods)
4. Adobe PDF (.pdf)
5. Textdateien & Markdown (.txt, .md, .csv)

## 4. Ergebnis
Dokumente werden semantisch analysiert und mit präziser Struktur für Sprachausgabe und Braille-Terminals bereitgestellt.`;
    }

    return {
        createSampleOdt: createSampleOdtBlob,
        createSampleDocx: createSampleDocxBlob,
        createSampleOds: createSampleOdsBlob,
        createSampleText: createSampleTextContent
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SampleDocs;
}
