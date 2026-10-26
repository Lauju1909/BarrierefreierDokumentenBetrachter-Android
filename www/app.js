/**
 * Barrierefreier Dokumenten-Betrachter (Android)
 * Vollständige Unterstützung für LibreOffice (ODT, ODS), Word (DOCX), PDF, Excel und Text
 * Optimiert für Google TalkBack, Braillezeilen und WCAG 2.2 AAA
 */

// Konstante für automatisches Versions-Bumping über GitHub Actions
const APP_VERSION = 'v1.0.3';

(function () {
    'use strict';

    // State Management
    const state = {
        currentDocName: '',
        currentDocType: '',
        currentHtml: '',
        headings: [],
        sentences: [],
        currentSentenceIndex: -1,
        isSpeaking: false,
        isPaused: false,
        searchResults: [],
        currentSearchIndex: -1,
        fontSize: parseInt(localStorage.getItem('doc_font_size') || '20', 10),
        spacing: localStorage.getItem('doc_spacing') || 'normal',
        theme: localStorage.getItem('doc_theme') || 'theme-dark',
        readingRulerActive: false
    };

    // DOM-Referenzen
    const elements = {
        srAnnouncements: document.getElementById('sr-announcements'),
        srAlerts: document.getElementById('sr-alerts'),
        appVersionDisplay: document.getElementById('app-version-display'),
        fileInput: document.getElementById('file-input'),
        btnOpenFile: document.getElementById('btn-open-file'),
        btnHeaderNewDoc: document.getElementById('btn-header-new-doc'),
        btnEmptyOpen: document.getElementById('btn-empty-open'),
        btnEmptyNew: document.getElementById('btn-empty-new'),
        btnSamples: document.getElementById('btn-samples'),
        btnToggleSettings: document.getElementById('btn-toggle-settings'),
        btnHelp: document.getElementById('btn-help'),
        a11yPanel: document.getElementById('accessibility-panel'),
        btnFontDecrease: document.getElementById('btn-font-decrease'),
        btnFontReset: document.getElementById('btn-font-reset'),
        btnFontIncrease: document.getElementById('btn-font-increase'),
        fontSizeDisplay: document.getElementById('current-fontsize-display'),
        btnToggleRuler: document.getElementById('btn-toggle-reading-ruler'),
        readingRuler: document.getElementById('reading-ruler'),

        // Dokument-Toolbar
        docToolbar: document.getElementById('document-toolbar'),
        docTypeBadge: document.getElementById('doc-type-badge'),
        docTitleDisplay: document.getElementById('doc-title-display'),
        docStats: document.getElementById('doc-stats'),
        btnHomeSave: document.getElementById('btn-home-save'),
        btnCloseDoc: document.getElementById('btn-close-doc'),
        btnToggleToc: document.getElementById('btn-toggle-toc'),
        btnToggleSearch: document.getElementById('btn-toggle-search'),

        // TTS Steuerung
        btnTtsPlay: document.getElementById('btn-tts-play'),
        btnTtsStop: document.getElementById('btn-tts-stop'),
        btnTtsPrev: document.getElementById('btn-tts-prev'),
        btnTtsNext: document.getElementById('btn-tts-next'),

        // Suche
        searchBar: document.getElementById('search-bar'),
        searchInput: document.getElementById('search-input'),
        btnSearchPrev: document.getElementById('btn-search-prev'),
        btnSearchNext: document.getElementById('btn-search-next'),
        searchResultsCounter: document.getElementById('search-results-counter'),
        btnCloseSearch: document.getElementById('btn-close-search'),

        // Viewports & Drawer
        emptyState: document.getElementById('empty-state'),
        docViewport: document.getElementById('doc-viewport'),
        docContent: document.getElementById('doc-content'),
        tocDrawer: document.getElementById('toc-drawer'),
        tocBackdrop: document.getElementById('toc-backdrop'),
        tocList: document.getElementById('toc-list'),
        btnCloseToc: document.getElementById('btn-close-toc'),
        btnCloseTocBottom: document.getElementById('btn-close-toc-bottom'),

        // Modale
        modalSamples: document.getElementById('modal-samples'),
        modalHelp: document.getElementById('modal-help'),
        modalNewDoc: document.getElementById('modal-new-doc'),
        newDocTitle: document.getElementById('new-doc-title'),
        newDocContent: document.getElementById('new-doc-content'),
        btnCreateNewDoc: document.getElementById('btn-create-new-doc'),

        // Verlauf & gespeicherte Dokumente
        recentDocsSection: document.getElementById('recent-docs-section'),
        recentDocsList: document.getElementById('recent-docs-list'),
        recentEmptyHint: document.getElementById('recent-empty-hint'),
        btnClearRecent: document.getElementById('btn-clear-recent')
    };

    // =========================================================================
    // 1. Initialisierung
    // =========================================================================
    document.addEventListener('DOMContentLoaded', () => {
        initVersion();
        initThemesAndStyles();
        initEventListeners();
        initRecentDocuments();
        setupCapacitorPlugins();
        checkPendingAndroidDocument();
        setTimeout(checkPendingAndroidDocument, 250);
        setTimeout(checkPendingAndroidDocument, 700);
        announceSR('Barrierefreier Dokumenten-Betrachter bereit. Öffne eine Datei oder ein Beispiel.');
    });

    function initVersion() {
        if (elements.appVersionDisplay) {
            elements.appVersionDisplay.textContent = APP_VERSION;
        }
    }

    function initThemesAndStyles() {
        // Theme anwenden
        document.body.className = state.theme;
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === state.theme);
        });

        // Schriftgröße anwenden
        applyFontSize(state.fontSize);

        // Zeilenabstand anwenden
        document.body.setAttribute('data-spacing', state.spacing);
        document.querySelectorAll('[data-spacing]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-spacing') === state.spacing);
        });
    }

    // =========================================================================
    // 2. Screenreader Ankündigungen (TalkBack & WCAG AAA) & AccessibleFeedback
    // =========================================================================
    function triggerAccessibleFeedback(type = 'tap') {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            const patterns = {
                tap: [15],
                success: [30, 50, 30],
                warning: [40, 60, 40],
                error: [80, 50, 80],
                boundary: [25, 25, 25]
            };
            try { navigator.vibrate(patterns[type] || [15]); } catch (_) {}
        }
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
            window.Capacitor.Plugins.Haptics.impact({ style: 'LIGHT' }).catch(() => {});
        }
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            if (!window.__sharedAudioCtx) window.__sharedAudioCtx = new AudioContext();
            const ctx = window.__sharedAudioCtx;
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime;
            
            if (type === 'success') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(164.81, now + 0.09);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'warning') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(392, now + 0.07);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === 'boundary') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(330, now);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
                osc.start(now);
                osc.stop(now + 0.09);
            } else { // tap
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                osc.start(now);
                osc.stop(now + 0.04);
            }
        } catch (_) {}
    }

    function triggerHaptic() {
        triggerAccessibleFeedback('tap');
    }

    class DocumentAriaQueue {
        constructor() {
            this.queue = [];
            this.isProcessing = false;
            this.timer = null;
        }

        announce(message, priority = 'polite') {
            if (!message) return;
            const cleanMsg = String(message).trim();
            if (!cleanMsg) return;

            if (priority === 'assertive') {
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
                this.queue.unshift({ message: cleanMsg, priority: 'assertive' });
                this.isProcessing = false;
                this.processNext();
            } else {
                this.queue.push({ message: cleanMsg, priority: 'polite' });
                if (!this.isProcessing) {
                    this.processNext();
                }
            }
        }

        processNext() {
            if (this.queue.length === 0) {
                this.isProcessing = false;
                return;
            }

            this.isProcessing = true;
            const item = this.queue.shift();
            const target = item.priority === 'assertive' ? elements.srAlerts : elements.srAnnouncements;

            if (target) {
                target.textContent = '';
                setTimeout(() => {
                    target.textContent = item.message;
                    const readDuration = Math.max(1200, item.message.length * 65);
                    this.timer = setTimeout(() => {
                        this.processNext();
                    }, readDuration);
                }, 50);
            } else {
                this.processNext();
            }
        }

        clear() {
            if (this.timer) clearTimeout(this.timer);
            this.timer = null;
            this.queue = [];
            this.isProcessing = false;
        }
    }

    const docAriaQueue = new DocumentAriaQueue();

    function announceSR(message, assertive = false) {
        docAriaQueue.announce(message, assertive ? 'assertive' : 'polite');
    }

    // =========================================================================
    // 3. Event Listener
    // =========================================================================
    function initEventListeners() {
        // Datei öffnen
        elements.btnOpenFile.addEventListener('click', () => {
            triggerHaptic();
            elements.fileInput.click();
        });

        elements.btnEmptyOpen.addEventListener('click', () => {
            triggerHaptic();
            elements.fileInput.click();
        });

        // Neues Dokument erstellen
        if (elements.btnEmptyNew) {
            elements.btnEmptyNew.addEventListener('click', () => {
                triggerHaptic();
                openNewDocumentModal();
            });
        }

        if (elements.btnHeaderNewDoc) {
            elements.btnHeaderNewDoc.addEventListener('click', () => {
                triggerHaptic();
                openNewDocumentModal();
            });
        }

        if (elements.btnCreateNewDoc) {
            elements.btnCreateNewDoc.addEventListener('click', () => {
                triggerHaptic();
                createNewDocumentFromModal();
            });
        }

        elements.fileInput.addEventListener('change', handleFileSelect);

        // Beispiele
        elements.btnSamples.addEventListener('click', () => {
            triggerHaptic();
            openModal(elements.modalSamples);
        });

        // Schnellauswahl Karten auf Startseite
        document.querySelectorAll('.sample-card, .sample-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sampleType = e.currentTarget.getAttribute('data-sample');
                loadSampleDocument(sampleType);
                closeModal(elements.modalSamples);
            });
        });

        // Einstellungen Leiste
        elements.btnToggleSettings.addEventListener('click', () => {
            triggerHaptic();
            const isHidden = elements.a11yPanel.hasAttribute('hidden');
            if (isHidden) {
                elements.a11yPanel.removeAttribute('hidden');
                elements.btnToggleSettings.setAttribute('aria-expanded', 'true');
                announceSR('Barrierefreiheits-Einstellungen geöffnet');
            } else {
                elements.a11yPanel.setAttribute('hidden', '');
                elements.btnToggleSettings.setAttribute('aria-expanded', 'false');
                announceSR('Einstellungen geschlossen');
            }
        });

        // Hilfe Modal
        elements.btnHelp.addEventListener('click', () => {
            triggerHaptic();
            openModal(elements.modalHelp);
        });

        // Modale schließen
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-close-modal');
                const modal = document.getElementById(modalId);
                if (modal) closeModal(modal);
            });
        });

        // Dokument schließen
        elements.btnCloseDoc.addEventListener('click', () => {
            triggerHaptic();
            closeCurrentDocument();
        });

        // Auf Startseite speichern und schließen
        if (elements.btnHomeSave) {
            elements.btnHomeSave.addEventListener('click', async () => {
                triggerHaptic();
                await handleHomeSave();
            });
        }

        // Theme Umschaltung
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', () => {
                triggerHaptic();
                const theme = btn.getAttribute('data-theme');
                document.body.className = theme;
                state.theme = theme;
                localStorage.setItem('doc_theme', theme);
                document.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                announceSR(`Design geändert auf: ${btn.textContent}`);
            });
        });

        // Schriftgrößen Steuerung
        elements.btnFontIncrease.addEventListener('click', () => {
            triggerHaptic();
            changeFontSize(2);
        });
        elements.btnFontDecrease.addEventListener('click', () => {
            triggerHaptic();
            changeFontSize(-2);
        });
        elements.btnFontReset.addEventListener('click', () => {
            triggerHaptic();
            applyFontSize(20);
            announceSR('Schriftgröße auf Standard 20 Pixel zurückgesetzt');
        });

        // Zeilenabstand
        document.querySelectorAll('[data-spacing]').forEach(btn => {
            btn.addEventListener('click', () => {
                triggerHaptic();
                const spacing = btn.getAttribute('data-spacing');
                document.body.setAttribute('data-spacing', spacing);
                state.spacing = spacing;
                localStorage.setItem('doc_spacing', spacing);
                document.querySelectorAll('[data-spacing]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                announceSR(`Zeilenabstand eingestellt auf: ${btn.textContent}`);
            });
        });

        // Lese-Lineal (Ruler)
        elements.btnToggleRuler.addEventListener('click', () => {
            triggerHaptic();
            state.readingRulerActive = !state.readingRulerActive;
            elements.btnToggleRuler.setAttribute('aria-pressed', String(state.readingRulerActive));
            if (state.readingRulerActive) {
                elements.readingRuler.removeAttribute('hidden');
                elements.btnToggleRuler.textContent = '📏 Lese-Lineal: An';
                announceSR('Lese-Lineal aktiviert. Bewege deinen Finger oder Cursor über das Dokument.');
            } else {
                elements.readingRuler.setAttribute('hidden', '');
                elements.btnToggleRuler.textContent = '📏 Lese-Lineal: Aus';
                announceSR('Lese-Lineal deaktiviert');
            }
        });

        // Ruler Bewegung verfolgen
        document.addEventListener('mousemove', updateRulerPosition);
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                updateRulerPosition(e.touches[0]);
            }
        }, { passive: true });

        // TTS Steuerung
        elements.btnTtsPlay.addEventListener('click', toggleTts);
        elements.btnTtsStop.addEventListener('click', stopTts);
        elements.btnTtsPrev.addEventListener('click', ttsPrevSentence);
        elements.btnTtsNext.addEventListener('click', ttsNextSentence);

        // Inhaltsverzeichnis Drawer
        elements.btnToggleToc.addEventListener('click', toggleToc);
        elements.btnCloseToc.addEventListener('click', () => {
            closeToc();
        });
        if (elements.btnCloseTocBottom) {
            elements.btnCloseTocBottom.addEventListener('click', () => {
                closeToc();
            });
        }
        if (elements.tocBackdrop) {
            elements.tocBackdrop.addEventListener('click', () => {
                closeToc();
            });
        }

        // Suche
        elements.btnToggleSearch.addEventListener('click', toggleSearch);
        elements.btnCloseSearch.addEventListener('click', closeSearch);
        elements.searchInput.addEventListener('input', performSearch);
        elements.btnSearchPrev.addEventListener('click', () => navigateSearch(-1));
        elements.btnSearchNext.addEventListener('click', () => navigateSearch(1));

        // Tastaturkürzel
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // Drag and Drop Unterstützung
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', handleFileDrop);

        // Verlauf leeren
        elements.btnClearRecent.addEventListener('click', async () => {
            triggerHaptic();
            if (typeof DocumentStorage !== 'undefined') {
                await DocumentStorage.clear();
            }
            localStorage.removeItem('recent_documents');
            await initRecentDocuments();
            announceSR('Alle gespeicherten Dokumente wurden aus der Liste entfernt.');
        });
    }

    function updateRulerPosition(e) {
        if (!state.readingRulerActive) return;
        const y = e.clientY;
        elements.readingRuler.style.top = `${y - 24}px`;
    }

    // =========================================================================
    // 4. Schriftgrößen-Steuerung
    // =========================================================================
    function changeFontSize(delta) {
        let newSize = state.fontSize + delta;
        if (newSize < 14) newSize = 14;
        if (newSize > 36) newSize = 36;
        applyFontSize(newSize);
        announceSR(`Schriftgröße: ${newSize} Pixel`);
    }

    function applyFontSize(size) {
        state.fontSize = size;
        localStorage.setItem('doc_font_size', String(size));
        document.body.setAttribute('data-font-size', String(size));
        if (elements.fontSizeDisplay) {
            elements.fontSizeDisplay.textContent = `${size} px`;
        }
    }

    // =========================================================================
    // 5. Dateiverarbeitung (ODT, DOCX, PDF, ODS, XLSX, TXT)
    // =========================================================================
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
        e.target.value = '';
    }

    function handleFileDrop(e) {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    }

    async function parseDocumentData(fileName, extension, data) {
        let html = '';
        switch (extension) {
            case 'odt':
                html = await parseOdt(data);
                break;
            case 'docx':
            case 'doc':
                html = await parseDocx(data);
                break;
            case 'pdf':
                html = await parsePdf(data);
                break;
            case 'ods':
            case 'xlsx':
            case 'xls':
                html = await parseSpreadsheet(data, extension);
                break;
            case 'txt':
            case 'md':
            case 'csv':
            case 'log':
            case 'rtf':
            default: {
                let textString = '';
                if (data instanceof ArrayBuffer) {
                    const decoder = new TextDecoder('utf-8');
                    textString = decoder.decode(data);
                } else {
                    textString = String(data);
                }
                html = parsePlainText(textString, extension);
                break;
            }
        }
        return html;
    }

    function processFile(file) {
        const fileName = file.name;
        const extension = fileName.split('.').pop().toLowerCase();
        announceSR(`Lade Datei: ${fileName}... Bitte warten.`);

        const reader = new FileReader();

        if (['odt', 'docx', 'doc', 'ods', 'xlsx', 'xls', 'pdf'].includes(extension)) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }

        reader.onload = async (event) => {
            try {
                const data = event.target.result;
                const html = await parseDocumentData(fileName, extension, data);
                displayDocument(fileName, extension.toUpperCase(), html);
                await saveRecentDocument(fileName, extension.toUpperCase(), html);
                announceSR(`Dokument erfolgreich geladen: ${fileName}`);
            } catch (err) {
                console.error('Fehler beim Parsen der Datei:', err);
                announceSR(`Fehler beim Öffnen von ${fileName}: ${err.message}`, true);
                alert(`Fehler beim Öffnen des Dokuments:\n${err.message}`);
            }
        };

        reader.onerror = () => {
            announceSR(`Fehler beim Lesen der Datei: ${fileName}`, true);
        };
    }

    // =========================================================================
    // Android Intent & Externe Dateien Öffnen (z. B. aus "Eigene Dateien")
    // =========================================================================
    function checkPendingAndroidDocument() {
        try {
            if (window.AndroidDocumentOpener && typeof window.AndroidDocumentOpener.getPendingDocument === 'function') {
                const pendingJsonStr = window.AndroidDocumentOpener.getPendingDocument();
                if (pendingJsonStr) {
                    const docData = JSON.parse(pendingJsonStr);
                    if (docData && docData.base64 && docData.name) {
                        announceSR(`Öffne Dokument von Gerät: ${docData.name}...`);
                        loadDocumentFromBase64(docData.name, docData.base64);
                    }
                }
            }
        } catch (e) {
            console.error('Fehler beim Prüfen auf Android Intent Dokument:', e);
        }
    }

    // Globaler Callback für Android onNewIntent
    window.onAndroidDocumentReceived = function (fileName, base64Data) {
        if (!fileName || !base64Data) return;
        announceSR(`Eingehendes Dokument empfangen: ${fileName}...`);
        loadDocumentFromBase64(fileName, base64Data);
    };

    async function loadDocumentFromBase64(fileName, base64Data) {
        try {
            const arrayBuffer = base64ToArrayBuffer(base64Data);
            const extension = fileName.split('.').pop().toLowerCase();
            announceSR(`Verarbeite ${fileName}...`);

            const html = await parseDocumentData(fileName, extension, arrayBuffer);
            displayDocument(fileName, extension.toUpperCase(), html);
            await saveRecentDocument(fileName, extension.toUpperCase(), html);
            announceSR(`Dokument erfolgreich geöffnet: ${fileName}`);
        } catch (err) {
            console.error('Fehler beim Öffnen des Android-Dokuments:', err);
            announceSR(`Fehler beim Öffnen von ${fileName}: ${err.message}`, true);
            alert(`Fehler beim Öffnen der Datei "${fileName}":\n${err.message}`);
        }
    }

    function base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Parser: ODT (LibreOffice Writer)
    async function parseOdt(arrayBuffer) {
        if (typeof OdtParser === 'undefined') {
            throw new Error('ODT-Parser-Modul nicht geladen.');
        }
        return await OdtParser.parse(arrayBuffer);
    }

    // Parser: DOCX (Microsoft Word)
    async function parseDocx(arrayBuffer) {
        if (typeof mammoth === 'undefined') {
            throw new Error('Mammoth DOCX-Bibliothek nicht geladen.');
        }
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        return result.value || '<p><em>(Leeres Word-Dokument)</em></p>';
    }

    // Parser: PDF (Adobe PDF)
    async function parsePdf(arrayBuffer) {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js Bibliothek nicht geladen.');
        }

        // Worker konfigurieren
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        let fullHtml = `<h1>PDF Dokument (${numPages} ${numPages === 1 ? 'Seite' : 'Seiten'})</h1>\n`;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            fullHtml += `<section class="pdf-page" role="region" aria-label="Seite ${pageNum}">\n`;
            fullHtml += `  <h2>Seite ${pageNum}</h2>\n`;

            let pageText = '';
            let currentLine = '';

            for (const item of textContent.items) {
                if (item.str) {
                    currentLine += item.str + ' ';
                    if (item.hasEOL) {
                        pageText += `<p>${escapeHtml(currentLine.trim())}</p>\n`;
                        currentLine = '';
                    }
                }
            }

            if (currentLine.trim()) {
                pageText += `<p>${escapeHtml(currentLine.trim())}</p>\n`;
            }

            fullHtml += pageText || '<p><em>(Kein lesbarer Text auf dieser Seite gefunden)</em></p>\n';
            fullHtml += `</section>\n`;
        }

        return fullHtml;
    }

    // Parser: ODS / XLSX (Tabellenkalkulation)
    async function parseSpreadsheet(arrayBuffer, ext) {
        if (typeof XLSX === 'undefined') {
            throw new Error('SheetJS XLSX/ODS Bibliothek nicht geladen.');
        }

        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetNames = workbook.SheetNames;

        if (!sheetNames || sheetNames.length === 0) {
            return '<p><em>(Keine Tabellenblätter im Dokument vorhanden)</em></p>';
        }

        let html = `<h1>Tabellendokument (${ext.toUpperCase()})</h1>\n`;

        for (const sheetName of sheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            html += `<section role="region" aria-label="Tabellenblatt ${escapeHtml(sheetName)}">\n`;
            html += `  <h2>Blatt: ${escapeHtml(sheetName)}</h2>\n`;

            if (jsonData.length === 0) {
                html += `  <p><em>(Leeres Blatt)</em></p>\n`;
            } else {
                html += `  <div class="table-responsive" tabindex="0" role="region" aria-label="Datentabelle ${escapeHtml(sheetName)}">\n`;
                html += `    <table role="table">\n`;

                for (let r = 0; r < jsonData.length; r++) {
                    const row = jsonData[r];
                    const isHeader = (r === 0);
                    html += `      <tr>\n`;

                    for (let c = 0; c < row.length; c++) {
                        const cellValue = row[c] !== undefined ? String(row[c]) : '';
                        const tag = isHeader ? 'th' : 'td';
                        const scope = isHeader ? ' scope="col"' : '';
                        html += `        <${tag}${scope}>${escapeHtml(cellValue) || '&nbsp;'}</${tag}>\n`;
                    }

                    html += `      </tr>\n`;
                }

                html += `    </table>\n  </div>\n`;
            }

            html += `</section>\n`;
        }

        return html;
    }

    // Parser: TXT / Markdown / CSV
    function parsePlainText(text, ext) {
        if (!text.trim()) {
            return '<p><em>(Leere Textdatei)</em></p>';
        }

        if (ext === 'csv') {
            // CSV Tabelle
            const lines = text.trim().split(/\r?\n/);
            let html = '<div class="table-responsive" tabindex="0" role="region" aria-label="CSV Tabelle">\n<table role="table">\n';

            for (let i = 0; i < lines.length; i++) {
                const row = lines[i].split(/[;,]/);
                const tag = (i === 0) ? 'th' : 'td';
                const scope = (i === 0) ? ' scope="col"' : '';
                html += '  <tr>\n';
                row.forEach(val => {
                    html += `    <${tag}${scope}>${escapeHtml(val.trim())}</${tag}>\n`;
                });
                html += '  </tr>\n';
            }
            html += '</table>\n</div>\n';
            return html;
        }

        // Markdown / Text Erkennung
        const lines = text.split(/\r?\n/);
        let html = '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                continue;
            }

            if (trimmed.startsWith('# ')) {
                html += `<h1>${escapeHtml(trimmed.substring(2))}</h1>\n`;
            } else if (trimmed.startsWith('## ')) {
                html += `<h2>${escapeHtml(trimmed.substring(3))}</h2>\n`;
            } else if (trimmed.startsWith('### ')) {
                html += `<h3>${escapeHtml(trimmed.substring(4))}</h3>\n`;
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                html += `<ul><li>${escapeHtml(trimmed.substring(2))}</li></ul>\n`;
            } else {
                html += `<p>${escapeHtml(trimmed)}</p>\n`;
            }
        }

        return html;
    }

    // =========================================================================
    // 6. Dokument anzeigen & TOC aufbauen
    // =========================================================================
    function displayDocument(title, type, html) {
        stopTts();
        state.currentDocName = title;
        state.currentDocType = type;
        state.currentHtml = html;

        // UI umschalten
        elements.emptyState.setAttribute('hidden', '');
        elements.docToolbar.removeAttribute('hidden');
        elements.docViewport.removeAttribute('hidden');

        elements.docTitleDisplay.textContent = title;
        elements.docTypeBadge.textContent = type;
        elements.docTypeBadge.className = `badge badge-${type.toLowerCase()}`;

        // HTML einsetzen
        elements.docContent.innerHTML = html;

        // Statistik ermitteln
        calculateDocumentStats();

        // Inhaltsverzeichnis aufbauen
        buildTableOfContents();

        // Text für Vorlesefunktion in Sätze zerlegen
        prepareTtsSentences();

        // Fokus auf Inhalt setzen
        elements.docViewport.focus();
    }

    function closeCurrentDocument(silent = false) {
        stopTts();
        state.currentDocName = '';
        state.currentDocType = '';
        state.currentHtml = '';
        state.headings = [];
        state.sentences = [];

        elements.docContent.innerHTML = '';
        elements.docToolbar.setAttribute('hidden', '');
        elements.docViewport.setAttribute('hidden', '');
        elements.emptyState.removeAttribute('hidden');
        closeToc(true);
        closeSearch(true);

        if (!silent) {
            announceSR('Dokument geschlossen. Zurück auf der Startseite.');
        }
    }

    function calculateDocumentStats() {
        const text = elements.docContent.innerText || '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const paragraphs = elements.docContent.querySelectorAll('p').length;
        const headings = elements.docContent.querySelectorAll('h1, h2, h3, h4, h5, h6').length;

        elements.docStats.textContent = `${headings} Überschriften · ${paragraphs} Absätze · ${words} Wörter`;
    }

    function buildTableOfContents() {
        elements.tocList.innerHTML = '';
        state.headings = [];

        const headingElements = elements.docContent.querySelectorAll('h1, h2, h3, h4, h5, h6');

        if (headingElements.length === 0) {
            elements.tocList.innerHTML = '<li><em>Keine Überschriften im Dokument gefunden.</em></li>';
            return;
        }

        headingElements.forEach((heading, index) => {
            const id = `heading-anchor-${index}`;
            heading.id = id;
            heading.setAttribute('tabindex', '-1');

            const level = parseInt(heading.tagName.replace('H', ''), 10);
            const text = heading.textContent.trim();

            state.headings.push({ id, level, text });

            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `toc-item-btn toc-level-${level}`;
            btn.textContent = text;
            btn.setAttribute('aria-label', `Ebene ${level}: ${text}`);

            btn.addEventListener('click', () => {
                triggerHaptic();
                closeToc(true);
                heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
                heading.focus();
                announceSR(`Gesprungen zu Überschrift: ${text}`);
            });

            li.appendChild(btn);
            elements.tocList.appendChild(li);
        });
    }

    function toggleToc() {
        triggerHaptic();
        const isHidden = elements.tocDrawer.hasAttribute('hidden');
        if (isHidden) {
            elements.tocDrawer.removeAttribute('hidden');
            if (elements.tocBackdrop) {
                elements.tocBackdrop.removeAttribute('hidden');
            }
            elements.btnToggleToc.setAttribute('aria-expanded', 'true');
            elements.btnCloseToc.focus();
            announceSR('Inhaltsverzeichnis geöffnet. Wähle eine Überschrift oder drücke Schließen.');
        } else {
            closeToc();
        }
    }

    function closeToc(silent = false) {
        const wasOpen = !elements.tocDrawer.hasAttribute('hidden');
        elements.tocDrawer.setAttribute('hidden', '');
        if (elements.tocBackdrop) {
            elements.tocBackdrop.setAttribute('hidden', '');
        }
        elements.btnToggleToc.setAttribute('aria-expanded', 'false');
        if (!silent && wasOpen) {
            elements.btnToggleToc.focus();
            announceSR('Inhaltsverzeichnis geschlossen. Zurück im Dokument.');
        }
    }

    // =========================================================================
    // 7. Beispieldokumente laden
    // =========================================================================
    async function loadSampleDocument(sampleType) {
        if (typeof SampleDocs === 'undefined') {
            announceSR('Beispieldokumente konnten nicht geladen werden', true);
            return;
        }

        announceSR('Lade Beispieldokument... Bitte warten.');

        try {
            switch (sampleType) {
                case 'odt': {
                    const buf = await SampleDocs.createSampleOdt();
                    const html = await parseOdt(buf);
                    displayDocument('LibreOffice_Writer_Beispiel.odt', 'ODT', html);
                    break;
                }
                case 'docx': {
                    const buf = await SampleDocs.createSampleDocx();
                    const html = await parseDocx(buf);
                    displayDocument('Word_Dokument_Beispiel.docx', 'DOCX', html);
                    break;
                }
                case 'ods': {
                    const buf = await SampleDocs.createSampleOds();
                    const html = await parseSpreadsheet(buf, 'ods');
                    displayDocument('Haushaltsbuch_Tabelle.ods', 'ODS', html);
                    break;
                }
                case 'txt': {
                    const text = SampleDocs.createSampleText();
                    const html = parsePlainText(text, 'md');
                    displayDocument('Barrierefreiheits_Protokoll.md', 'TXT', html);
                    break;
                }
                default:
                    announceSR('Unbekanntes Beispielfomat', true);
                    return;
            }

            await saveRecentDocument(state.currentDocName, state.currentDocType, state.currentHtml);
            announceSR(`Beispieldokument erfolgreich geöffnet: ${state.currentDocName}`);
        } catch (err) {
            console.error('Fehler beim Laden des Beispiels:', err);
            announceSR(`Fehler beim Beispieldokument: ${err.message}`, true);
        }
    }

    // =========================================================================
    // 8. Text-To-Speech (TTS / Vorlesemodus mit Satznavigation)
    // =========================================================================
    function prepareTtsSentences() {
        state.sentences = [];
        state.currentSentenceIndex = -1;

        const textBlocks = elements.docContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, th, td');

        textBlocks.forEach((block, blockIndex) => {
            const rawText = block.innerText.trim();
            if (!rawText) return;

            // Sätze aufteilen
            const matches = rawText.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g);
            if (matches) {
                matches.forEach(sentenceText => {
                    const clean = sentenceText.trim();
                    if (clean.length > 0) {
                        state.sentences.push({
                            text: clean,
                            element: block
                        });
                    }
                });
            }
        });
    }

    function toggleTts() {
        triggerHaptic();
        if (!('speechSynthesis' in window)) {
            announceSR('Sprachausgabe (Text-to-Speech) wird auf diesem Gerät nicht unterstützt.', true);
            return;
        }

        if (state.isSpeaking && !state.isPaused) {
            // Pausieren
            window.speechSynthesis.pause();
            state.isPaused = true;
            updateTtsButton('▶️ Weiter');
            announceSR('Vorlesen pausiert');
        } else if (state.isPaused) {
            // Fortsetzen
            window.speechSynthesis.resume();
            state.isPaused = false;
            updateTtsButton('⏸️ Pause');
            announceSR('Vorlesen fortgesetzt');
        } else {
            // Neu starten
            if (state.sentences.length === 0) {
                announceSR('Kein Text zum Vorlesen vorhanden');
                return;
            }
            if (state.currentSentenceIndex === -1) {
                state.currentSentenceIndex = 0;
            }
            playCurrentSentence();
        }
    }

    function playCurrentSentence() {
        if (state.currentSentenceIndex < 0 || state.currentSentenceIndex >= state.sentences.length) {
            stopTts();
            announceSR('Dokument fertig vorgelesen.');
            return;
        }

        window.speechSynthesis.cancel();

        const item = state.sentences[state.currentSentenceIndex];
        highlightSentenceElement(item.element);

        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.lang = 'de-DE';
        utterance.rate = 1.0;

        utterance.onend = () => {
            if (state.isSpeaking && !state.isPaused) {
                state.currentSentenceIndex++;
                playCurrentSentence();
            }
        };

        utterance.onerror = (e) => {
            console.warn('TTS Fehler:', e);
            stopTts();
        };

        state.isSpeaking = true;
        state.isPaused = false;
        updateTtsButton('⏸️ Pause');

        if (window.DocumentBridge && typeof window.DocumentBridge.interruptTalkBack === 'function') {
            try { window.DocumentBridge.interruptTalkBack(); } catch (_) {}
        }

        if (window.AndroidDocumentOpener && typeof window.AndroidDocumentOpener.interruptTalkBack === 'function') {
            try { window.AndroidDocumentOpener.interruptTalkBack(); } catch (_) {}
        }
        window.speechSynthesis.speak(utterance);
    }

    function stopTts() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        state.isSpeaking = false;
        state.isPaused = false;
        clearSentenceHighlight();
        updateTtsButton('▶️ Vorlesen');
    }

    function ttsNextSentence() {
        triggerHaptic();
        if (state.currentSentenceIndex < state.sentences.length - 1) {
            state.currentSentenceIndex++;
            playCurrentSentence();
            announceSR(`Nächster Satz: ${state.sentences[state.currentSentenceIndex].text}`);
        } else {
            announceSR('Ende des Dokuments erreicht');
        }
    }

    function ttsPrevSentence() {
        triggerHaptic();
        if (state.currentSentenceIndex > 0) {
            state.currentSentenceIndex--;
            playCurrentSentence();
            announceSR(`Vorheriger Satz: ${state.sentences[state.currentSentenceIndex].text}`);
        } else {
            announceSR('Anfang des Dokuments erreicht');
        }
    }

    function updateTtsButton(text) {
        if (!elements.btnTtsPlay) return;
        const iconSpan = elements.btnTtsPlay.querySelector('.tts-icon');
        const textSpan = elements.btnTtsPlay.querySelector('.tts-text');
        if (text.includes('Pause')) {
            if (iconSpan) iconSpan.textContent = '⏸️';
            if (textSpan) textSpan.textContent = 'Pause';
            elements.btnTtsPlay.setAttribute('aria-label', 'Vorlesen pausieren');
        } else if (text.includes('Weiter')) {
            if (iconSpan) iconSpan.textContent = '▶️';
            if (textSpan) textSpan.textContent = 'Weiter';
            elements.btnTtsPlay.setAttribute('aria-label', 'Vorlesen fortsetzen');
        } else {
            if (iconSpan) iconSpan.textContent = '▶️';
            if (textSpan) textSpan.textContent = 'Vorlesen';
            elements.btnTtsPlay.setAttribute('aria-label', 'Vorlesen starten');
        }
    }

    function highlightSentenceElement(el) {
        clearSentenceHighlight();
        if (el) {
            el.classList.add('tts-sentence-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function clearSentenceHighlight() {
        document.querySelectorAll('.tts-sentence-highlight').forEach(el => {
            el.classList.remove('tts-sentence-highlight');
        });
    }

    // =========================================================================
    // 9. Volltext-Suche
    // =========================================================================
    function toggleSearch() {
        triggerHaptic();
        const isHidden = elements.searchBar.hasAttribute('hidden');
        if (isHidden) {
            elements.searchBar.removeAttribute('hidden');
            elements.btnToggleSearch.setAttribute('aria-expanded', 'true');
            elements.searchInput.focus();
            announceSR('Suche geöffnet');
        } else {
            closeSearch();
        }
    }

    function closeSearch(silent = false) {
        const wasOpen = !elements.searchBar.hasAttribute('hidden');
        elements.searchBar.setAttribute('hidden', '');
        elements.btnToggleSearch.setAttribute('aria-expanded', 'false');
        elements.searchInput.value = '';
        clearSearchHighlights();
        if (!silent && wasOpen) {
            announceSR('Suche geschlossen');
        }
    }

    function performSearch() {
        const query = elements.searchInput.value.trim().toLowerCase();
        clearSearchHighlights();
        state.searchResults = [];
        state.currentSearchIndex = -1;

        if (!query || query.length < 2) {
            elements.searchResultsCounter.textContent = 'Suchbegriff eingeben';
            return;
        }

        // Suche im Text
        const textNodes = [];
        const walk = document.createTreeWalker(elements.docContent, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while ((n = walk.nextNode())) {
            if (n.textContent.toLowerCase().includes(query)) {
                textNodes.push(n);
            }
        }

        let totalMatches = 0;
        textNodes.forEach(node => {
            const parent = node.parentNode;
            if (parent && parent.nodeName !== 'SCRIPT' && parent.nodeName !== 'STYLE') {
                const text = node.textContent;
                const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
                const fragment = document.createElement('span');
                fragment.innerHTML = escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');

                const marks = fragment.querySelectorAll('.search-highlight');
                marks.forEach(m => state.searchResults.push(m));
                totalMatches += marks.length;

                parent.replaceChild(fragment, node);
            }
        });

        if (totalMatches > 0) {
            state.currentSearchIndex = 0;
            updateSearchFocus();
            elements.searchResultsCounter.textContent = `1 von ${totalMatches}`;
            announceSR(`${totalMatches} Treffer gefunden`);
        } else {
            elements.searchResultsCounter.textContent = 'Keine Treffer';
            announceSR('Keine Treffer im Dokument');
        }
    }

    function navigateSearch(direction) {
        triggerHaptic();
        if (state.searchResults.length === 0) return;

        state.currentSearchIndex += direction;
        if (state.currentSearchIndex < 0) {
            state.currentSearchIndex = state.searchResults.length - 1;
        } else if (state.currentSearchIndex >= state.searchResults.length) {
            state.currentSearchIndex = 0;
        }

        updateSearchFocus();
        elements.searchResultsCounter.textContent = `${state.currentSearchIndex + 1} von ${state.searchResults.length}`;
    }

    function updateSearchFocus() {
        state.searchResults.forEach((el, idx) => {
            if (idx === state.currentSearchIndex) {
                el.classList.add('current-match');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                el.classList.remove('current-match');
            }
        });
    }

    function clearSearchHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });
        state.searchResults = [];
    }

    // =========================================================================
    // 10. Verlauf & Dokumenten-Speicherung (Startseite / Offline-Speicher)
    // =========================================================================
    async function saveRecentDocument(name, type, html = '') {
        const docToSave = {
            id: 'doc_' + encodeURIComponent(name),
            name: name,
            type: type,
            html: html || state.currentHtml || ''
        };

        try {
            if (typeof DocumentStorage !== 'undefined') {
                await DocumentStorage.save(docToSave);
            }
        } catch (e) {
            console.warn('Fehler beim Speichern in DocumentStorage:', e);
        }

        // Auch localStorage Verlauf für Redundanz pflegen
        let recents = JSON.parse(localStorage.getItem('recent_documents') || '[]');
        recents = recents.filter(item => item.name !== name);
        recents.unshift({ name, type, date: new Date().toLocaleDateString('de-DE') });
        if (recents.length > 10) recents.pop();
        localStorage.setItem('recent_documents', JSON.stringify(recents));

        await initRecentDocuments();
    }

    async function initRecentDocuments() {
        let docs = [];
        try {
            if (typeof DocumentStorage !== 'undefined') {
                docs = await DocumentStorage.getAll();
            }
        } catch (e) {
            console.warn('Fehler beim Laden von DocumentStorage:', e);
        }

        if (!docs || docs.length === 0) {
            const fallback = JSON.parse(localStorage.getItem('recent_documents') || '[]');
            docs = fallback.map(item => ({
                id: 'doc_' + encodeURIComponent(item.name),
                name: item.name,
                type: item.type,
                date: item.date,
                html: ''
            }));
        }

        if (elements.recentDocsList) {
            elements.recentDocsList.innerHTML = '';
        }

        if (docs.length === 0) {
            if (elements.recentEmptyHint) {
                elements.recentEmptyHint.removeAttribute('hidden');
            }
            return;
        }

        if (elements.recentEmptyHint) {
            elements.recentEmptyHint.setAttribute('hidden', '');
        }

        docs.forEach(doc => {
            const li = document.createElement('li');
            li.className = 'recent-item-row';

            const openBtn = document.createElement('button');
            openBtn.type = 'button';
            openBtn.className = 'recent-open-btn';
            openBtn.setAttribute('aria-label', `Dokument öffnen: ${doc.name}, Typ ${doc.type}, Datum ${doc.date || ''}`);
            openBtn.innerHTML = `
                <span><strong>[${escapeHtml(doc.type)}]</strong> ${escapeHtml(doc.name)}</span>
                <small>${escapeHtml(doc.date || '')}</small>
            `;

            openBtn.addEventListener('click', async () => {
                triggerHaptic();
                announceSR(`Öffne Dokument: ${doc.name}`);

                // Falls HTML direkt im Offline-Speicher vorhanden ist, direkt öffnen
                if (doc.html && doc.html.trim().length > 0) {
                    displayDocument(doc.name, doc.type, doc.html);
                    await saveRecentDocument(doc.name, doc.type, doc.html);
                    announceSR(`Dokument geladen: ${doc.name}`);
                } else {
                    // Falls kein HTML gecacht, Dateiauswahl anfordern
                    announceSR(`Bitte wähle die Datei "${doc.name}" auf deinem Gerät aus.`);
                    elements.fileInput.click();
                }
            });

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'recent-delete-btn';
            delBtn.setAttribute('aria-label', `${doc.name} aus gespeicherten Dokumenten entfernen`);
            delBtn.textContent = '🗑️';
            delBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                triggerHaptic();
                if (typeof DocumentStorage !== 'undefined') {
                    await DocumentStorage.delete(doc.id);
                }
                let recents = JSON.parse(localStorage.getItem('recent_documents') || '[]');
                recents = recents.filter(item => item.name !== doc.name);
                localStorage.setItem('recent_documents', JSON.stringify(recents));
                announceSR(`${doc.name} entfernt`);
                await initRecentDocuments();
            });

            li.appendChild(openBtn);
            li.appendChild(delBtn);
            elements.recentDocsList.appendChild(li);
        });
    }

    async function handleHomeSave() {
        if (!state.currentDocName) {
            closeCurrentDocument();
            return;
        }

        const savedDocName = state.currentDocName;
        const savedDocType = state.currentDocType;
        const savedDocHtml = state.currentHtml;

        announceSR(`Speichere "${savedDocName}" auf der Startseite...`);
        await saveRecentDocument(savedDocName, savedDocType, savedDocHtml);
        closeCurrentDocument(true);
        announceSR(`"${savedDocName}" erfolgreich auf der Startseite gespeichert.`);
    }

    function openNewDocumentModal() {
        if (!elements.modalNewDoc) return;
        if (elements.newDocTitle) elements.newDocTitle.value = 'Neues Dokument';
        if (elements.newDocContent) elements.newDocContent.value = '';
        openModal(elements.modalNewDoc);
        if (elements.newDocTitle) elements.newDocTitle.focus();
        announceSR('Neues Dokument Dialog geöffnet. Gib einen Titel und Inhalt ein.');
    }

    async function createNewDocumentFromModal() {
        const title = (elements.newDocTitle && elements.newDocTitle.value.trim()) || 'Unbenanntes Dokument';
        const content = (elements.newDocContent && elements.newDocContent.value) || '';

        const docName = title.endsWith('.txt') ? title : `${title}.txt`;
        const html = parsePlainText(content, 'txt');

        closeModal(elements.modalNewDoc);
        displayDocument(docName, 'TXT', html);
        await saveRecentDocument(docName, 'TXT', html);
        announceSR(`Neues Dokument "${docName}" erstellt und geöffnet.`);
    }

    // =========================================================================
    // 11. Dialoge & Modale
    // =========================================================================
    function openModal(modal) {
        if (!modal) return;
        modal.removeAttribute('hidden');
        const focusable = modal.querySelector('button, [tabindex="0"]');
        if (focusable) focusable.focus();
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.setAttribute('hidden', '');
    }

    // =========================================================================
    // 12. Tastaturkürzel
    // =========================================================================
    function handleKeyboardShortcuts(e) {
        // Esc schließt Modale und Drawers
        if (e.key === 'Escape') {
            closeModal(elements.modalSamples);
            closeModal(elements.modalHelp);
            closeModal(elements.modalNewDoc);
            closeToc();
            closeSearch();
            return;
        }

        if (e.altKey) {
            switch (e.key.toLowerCase()) {
                case 'o':
                    e.preventDefault();
                    elements.btnOpenFile.click();
                    break;
                case 'p':
                    e.preventDefault();
                    toggleTts();
                    break;
                case 'i':
                    e.preventDefault();
                    toggleToc();
                    break;
                case 'f':
                    e.preventDefault();
                    toggleSearch();
                    break;
                case '+':
                    e.preventDefault();
                    changeFontSize(2);
                    break;
                case '-':
                    e.preventDefault();
                    changeFontSize(-2);
                    break;
                case 'k':
                    e.preventDefault();
                    cycleThemes();
                    break;
            }
        }
    }

    function cycleThemes() {
        const themes = ['theme-light', 'theme-dark', 'theme-high-contrast', 'theme-sepia'];
        const currentIdx = themes.indexOf(state.theme);
        const nextTheme = themes[(currentIdx + 1) % themes.length];
        document.body.className = nextTheme;
        state.theme = nextTheme;
        localStorage.setItem('doc_theme', nextTheme);
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === nextTheme);
        });
        announceSR(`Kontrast-Design gewechselt auf: ${nextTheme}`);
    }

    // =========================================================================
    // 13. Capacitor Android Integration
    // =========================================================================
    function setupCapacitorPlugins() {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('appUrlOpen', () => {
                setTimeout(checkPendingAndroidDocument, 150);
            });
            window.Capacitor.Plugins.App.addListener('appStateChange', (s) => {
                if (s && s.isActive) {
                    setTimeout(checkPendingAndroidDocument, 150);
                }
            });
            window.Capacitor.Plugins.App.addListener('backButton', () => {
                if (!elements.tocDrawer.hasAttribute('hidden')) {
                    closeToc();
                } else if (elements.modalNewDoc && !elements.modalNewDoc.hasAttribute('hidden')) {
                    closeModal(elements.modalNewDoc);
                } else if (!elements.modalSamples.hasAttribute('hidden')) {
                    closeModal(elements.modalSamples);
                } else if (!elements.modalHelp.hasAttribute('hidden')) {
                    closeModal(elements.modalHelp);
                } else if (!elements.searchBar.hasAttribute('hidden')) {
                    closeSearch();
                } else if (!elements.a11yPanel.hasAttribute('hidden')) {
                    elements.a11yPanel.setAttribute('hidden', '');
                    elements.btnToggleSettings.setAttribute('aria-expanded', 'false');
                } else if (!elements.docViewport.hasAttribute('hidden')) {
                    closeCurrentDocument();
                } else {
                    window.Capacitor.Plugins.App.exitApp();
                }
            });
        }
    }

    // Hilfsfunktionen
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

})();
