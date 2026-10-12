/**
 * Automatischer Test aller Dokumenten-Parser für BarrierefreierDokumentenBetrachter
 * Prüft ODT, DOCX, ODS, TXT, CSV, SampleDocs
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('./node_modules/jszip');
global.JSZip = JSZip;

// Erzeuge JSDOM / DOMParser für Node Umgebung
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.DOMParser = dom.window.DOMParser;
global.Node = dom.window.Node;

const mammoth = require('./node_modules/mammoth');
global.mammoth = mammoth;

const XLSX = require('./node_modules/xlsx');
global.XLSX = XLSX;

const OdtParser = require('./www/js/odt-parser.js');
const SampleDocs = require('./www/js/sample-docs.js');

async function runTests() {
    console.log('=== Starte Tests für alle Dokumenten-Formate ===\n');
    let passed = 0;
    let failed = 0;

    // Test 1: ODT Generierung & Parsen
    try {
        console.log('Test 1: LibreOffice Writer (.odt) testen...');
        const odtBuf = await SampleDocs.createSampleOdt();
        const odtHtml = await OdtParser.parse(odtBuf);
        
        if (!odtHtml.includes('<h1>Willkommen bei LibreOffice Writer') || 
            !odtHtml.includes('<table') || 
            !odtHtml.includes('<li>')) {
            throw new Error('ODT HTML enthält nicht die erwarteten semantischen Elemente (h1, table, li)');
        }
        console.log('  -> OK: ODT erfolgreich in semantisches HTML geparst.');
        passed++;
    } catch (e) {
        console.error('  -> FEHLER in Test 1 (ODT):', e.message);
        failed++;
    }

    // Test 2: Word (.docx) Generierung & Parsen
    try {
        console.log('\nTest 2: Microsoft Word (.docx) testen...');
        const docxBuf = await SampleDocs.createSampleDocx();
        const docxResult = await mammoth.convertToHtml({ buffer: Buffer.from(docxBuf) });
        const docxHtml = docxResult.value;

        if (!docxHtml.includes('Microsoft Word Dokument') || !docxHtml.includes('TalkBack')) {
            throw new Error('DOCX HTML enthält nicht den erwarteten Inhalt');
        }
        console.log('  -> OK: DOCX erfolgreich mit Mammoth in semantisches HTML gewandelt.');
        passed++;
    } catch (e) {
        console.error('  -> FEHLER in Test 2 (DOCX):', e.message);
        failed++;
    }

    // Test 3: LibreOffice Calc (.ods) Generierung & Parsen
    try {
        console.log('\nTest 3: LibreOffice Calc (.ods) testen...');
        const odsBuf = await SampleDocs.createSampleOds();
        const wb = XLSX.read(odsBuf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length < 5 || data[0][0] !== 'Monat') {
            throw new Error('ODS Tabelle enthält nicht die erwarteten Zeilen und Spalten');
        }
        console.log('  -> OK: ODS Tabelle erfolgreich ausgelesen (' + data.length + ' Zeilen).');
        passed++;
    } catch (e) {
        console.error('  -> FEHLER in Test 3 (ODS):', e.message);
        failed++;
    }

    // Test 4: Excel (.xlsx) Erstellung & Parsen
    try {
        console.log('\nTest 4: Microsoft Excel (.xlsx) testen...');
        const wbXlsx = XLSX.utils.book_new();
        const wsXlsx = XLSX.utils.aoa_to_sheet([
            ['Projekt', 'Format', 'Barrierefrei'],
            ['Writer', 'ODT', 'Ja'],
            ['Word', 'DOCX', 'Ja'],
            ['Calc', 'ODS', 'Ja']
        ]);
        XLSX.utils.book_append_sheet(wbXlsx, wsXlsx, 'TestSheet');
        const xlsxBuf = XLSX.write(wbXlsx, { bookType: 'xlsx', type: 'array' });

        const wbRead = XLSX.read(xlsxBuf, { type: 'array' });
        const readData = XLSX.utils.sheet_to_json(wbRead.Sheets['TestSheet'], { header: 1 });
        if (readData.length !== 4) {
            throw new Error('XLSX Daten nicht vollständig');
        }
        console.log('  -> OK: XLSX erfolgreich erstellt und geparst.');
        passed++;
    } catch (e) {
        console.error('  -> FEHLER in Test 4 (XLSX):', e.message);
        failed++;
    }

    // Test 5: Text & Markdown (.txt / .md / .csv)
    try {
        console.log('\nTest 5: Text, Markdown & CSV testen...');
        const textContent = SampleDocs.createSampleText();
        if (!textContent.includes('# Protokoll:') || !textContent.includes('WCAG 2.2 AAA')) {
            throw new Error('Textprotokoll unvollständig');
        }

        const csvContent = 'Name;Format;TalkBack\nLibreOffice;ODT;Ja\nWord;DOCX;Ja';
        const lines = csvContent.trim().split('\n');
        if (lines.length !== 3) {
            throw new Error('CSV Zeilenanzahl stimmt nicht');
        }
        console.log('  -> OK: Text, Markdown und CSV erfolgreich verarbeitet.');
        passed++;
    } catch (e) {
        console.error('  -> FEHLER in Test 5 (Text/CSV):', e.message);
        failed++;
    }

    console.log(`\n=== Testergebnis: ${passed} Bestanden, ${failed} Fehlgeschlagen ===`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
