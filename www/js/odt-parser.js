/**
 * OdtParser - Barrierefreier Parser für LibreOffice / OpenOffice Writer Dokumente (.odt)
 * Extrahiert 100% semantisches HTML (h1-h6, p, ul, ol, li, table) für TalkBack & Screenreader.
 * Arbeitet 100% lokal und offline mit JSZip.
 */
const OdtParser = (function () {
    'use strict';

    function parseOdtArrayBuffer(arrayBuffer) {
        if (typeof JSZip === 'undefined') {
            return Promise.reject(new Error('JSZip ist nicht geladen.'));
        }

        return JSZip.loadAsync(arrayBuffer).then(function (zip) {
            const contentFile = zip.file('content.xml');
            if (!contentFile) {
                throw new Error('Ungültiges ODT-Dokument: "content.xml" fehlt im Archiv.');
            }

            return contentFile.async('text').then(function (xmlText) {
                return parseContentXml(xmlText);
            });
        });
    }

    function parseContentXml(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML-Fehler beim Verarbeiten des ODT-Dokuments: ' + parseError.textContent);
        }

        // Suche nach office:text oder beliebigem text-Body
        const textBody = xmlDoc.getElementsByTagName('office:text')[0] || 
                         xmlDoc.querySelector('text') || 
                         xmlDoc.documentElement;

        if (!textBody) {
            return '<p><em>Dokument enthält keinen Textkörper.</em></p>';
        }

        let html = '';
        const childNodes = textBody.children;

        for (let i = 0; i < childNodes.length; i++) {
            const node = childNodes[i];
            html += renderNode(node);
        }

        return html.trim() ? html : '<p><em>(Leeres Dokument)</em></p>';
    }

    function renderNode(node) {
        const tagName = node.tagName.toLowerCase();

        // Überschrift (text:h)
        if (tagName.endsWith(':h') || tagName === 'h') {
            let level = parseInt(node.getAttribute('text:outline-level') || '1', 10);
            if (isNaN(level) || level < 1) level = 1;
            if (level > 6) level = 6;
            const textContent = extractFormattedText(node);
            if (!textContent.trim()) return '';
            return `<h${level}>${textContent}</h${level}>\n`;
        }

        // Absatz (text:p)
        if (tagName.endsWith(':p') || tagName === 'p') {
            const textContent = extractFormattedText(node);
            if (!textContent.trim()) {
                return '<p class="empty-paragraph" aria-hidden="true">&nbsp;</p>\n';
            }
            return `<p>${textContent}</p>\n`;
        }

        // Liste (text:list)
        if (tagName.endsWith(':list') || tagName === 'list') {
            let listHtml = '<ul>\n';
            for (let j = 0; j < node.children.length; j++) {
                const itemNode = node.children[j];
                const itemTag = itemNode.tagName.toLowerCase();
                if (itemTag.endsWith(':list-item') || itemTag === 'list-item') {
                    let itemContent = '';
                    for (let k = 0; k < itemNode.children.length; k++) {
                        itemContent += renderNode(itemNode.children[k]);
                    }
                    if (!itemContent.trim()) {
                        itemContent = extractFormattedText(itemNode);
                    }
                    listHtml += `  <li>${itemContent}</li>\n`;
                }
            }
            listHtml += '</ul>\n';
            return listHtml;
        }

        // Tabelle (table:table)
        if (tagName.endsWith(':table') || tagName === 'table') {
            const tableName = node.getAttribute('table:name') || 'Tabelle';
            let tableHtml = `<div class="table-responsive" role="region" aria-label="Tabelle ${escapeHtml(tableName)}" tabindex="0">\n`;
            tableHtml += `  <table role="table">\n`;
            tableHtml += `    <caption class="sr-only">Tabelle: ${escapeHtml(tableName)}</caption>\n`;

            const rows = node.querySelectorAll('table\\:table-row, table-row');
            if (rows.length > 0) {
                for (let r = 0; r < rows.length; r++) {
                    const row = rows[r];
                    const isFirstRow = (r === 0);
                    tableHtml += `    <tr>\n`;

                    const cells = row.children;
                    for (let c = 0; c < cells.length; c++) {
                        const cell = cells[c];
                        const cellTag = cell.tagName.toLowerCase();
                        if (cellTag.endsWith(':table-cell') || cellTag === 'table-cell') {
                            const repeat = parseInt(cell.getAttribute('table:number-columns-repeated') || '1', 10);
                            const cellContent = extractCellContent(cell);
                            const tag = isFirstRow ? 'th' : 'td';
                            const scopeAttr = isFirstRow ? ' scope="col"' : '';

                            const repeatLimit = Math.min(repeat, 20); // Schutz vor riesigen Wiederholungen
                            for (let rep = 0; rep < repeatLimit; rep++) {
                                tableHtml += `      <${tag}${scopeAttr}>${cellContent || '&nbsp;'}</${tag}>\n`;
                            }
                        }
                    }
                    tableHtml += `    </tr>\n`;
                }
            }

            tableHtml += `  </table>\n</div>\n`;
            return tableHtml;
        }

        // Abschnitt (text:section)
        if (tagName.endsWith(':section') || tagName === 'section') {
            let sectionHtml = '<section>\n';
            for (let s = 0; s < node.children.length; s++) {
                sectionHtml += renderNode(node.children[s]);
            }
            sectionHtml += '</section>\n';
            return sectionHtml;
        }

        return '';
    }

    function extractCellContent(cellNode) {
        let text = '';
        for (let i = 0; i < cellNode.children.length; i++) {
            const child = cellNode.children[i];
            const tag = child.tagName.toLowerCase();
            if (tag.endsWith(':p') || tag === 'p') {
                if (text) text += '<br>';
                text += extractFormattedText(child);
            }
        }
        if (!text.trim()) {
            text = extractFormattedText(cellNode);
        }
        return text;
    }

    function extractFormattedText(container) {
        let result = '';

        function traverse(el) {
            for (let i = 0; i < el.childNodes.length; i++) {
                const child = el.childNodes[i];
                if (child.nodeType === Node.TEXT_NODE) {
                    result += escapeHtml(child.textContent);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const tag = child.tagName.toLowerCase();

                    if (tag.endsWith(':line-break') || tag === 'line-break') {
                        result += '<br>';
                    } else if (tag.endsWith(':s') || tag === 's') {
                        const count = parseInt(child.getAttribute('text:c') || '1', 10);
                        result += ' '.repeat(Math.min(count, 50));
                    } else if (tag.endsWith(':tab') || tag === 'tab') {
                        result += ' &nbsp; ';
                    } else if (tag.endsWith(':a') || tag === 'a') {
                        const href = child.getAttribute('xlink:href') || '#';
                        result += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${extractFormattedText(child)}</a>`;
                    } else if (tag.endsWith(':span') || tag === 'span') {
                        // Textspanne
                        result += extractFormattedText(child);
                    } else {
                        traverse(child);
                    }
                }
            }
        }

        traverse(container);
        return result;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    return {
        parse: parseOdtArrayBuffer,
        parseXml: parseContentXml
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OdtParser;
}
