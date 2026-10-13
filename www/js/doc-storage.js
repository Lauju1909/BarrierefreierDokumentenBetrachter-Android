/**
 * DocumentStorage - Lokale persistente Dokumentenspeicherung mit IndexedDB
 * Ermöglicht das Speichern, Wiederöffnen und Verwalten aller geöffneten Dokumente
 * direkt auf der Startseite (100% offline & datenschutzkonform).
 */
const DocumentStorage = (function () {
    'use strict';

    const DB_NAME = 'DokumentenBetrachterDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'documents';
    let dbInstance = null;

    function openDB() {
        if (dbInstance) {
            return Promise.resolve(dbInstance);
        }

        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                return reject(new Error('IndexedDB nicht unterstützt'));
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                dbInstance = event.target.result;
                resolve(dbInstance);
            };

            request.onerror = (event) => {
                console.warn('IndexedDB Fehler, Fallback auf localStorage:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async function saveDocument(doc) {
        // id aus Dateinamen generieren falls nicht vorhanden
        if (!doc.id) {
            doc.id = 'doc_' + encodeURIComponent(doc.name);
        }
        doc.timestamp = Date.now();
        doc.date = new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.put(doc);
                req.onsuccess = () => resolve(doc);
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            // Fallback auf localStorage
            saveToLocalStorage(doc);
            return Promise.resolve(doc);
        }
    }

    async function getAllDocuments() {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.getAll();

                req.onsuccess = () => {
                    const docs = req.result || [];
                    docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    resolve(docs);
                };
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            return Promise.resolve(getFromLocalStorage());
        }
    }

    async function getDocument(id) {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            const docs = getFromLocalStorage();
            return Promise.resolve(docs.find(d => d.id === id) || null);
        }
    }

    async function deleteDocument(id) {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.delete(id);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            deleteFromLocalStorage(id);
            return Promise.resolve();
        }
    }

    async function clearAll() {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.clear();
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            localStorage.removeItem('cached_documents_v1');
            return Promise.resolve();
        }
    }

    // LocalStorage Fallback Helfer
    function saveToLocalStorage(doc) {
        try {
            let list = getFromLocalStorage();
            list = list.filter(d => d.id !== doc.id);
            list.unshift(doc);
            if (list.length > 20) list.pop();
            localStorage.setItem('cached_documents_v1', JSON.stringify(list));
        } catch (e) {
            console.warn('LocalStorage voll:', e);
        }
    }

    function getFromLocalStorage() {
        try {
            return JSON.parse(localStorage.getItem('cached_documents_v1') || '[]');
        } catch (e) {
            return [];
        }
    }

    function deleteFromLocalStorage(id) {
        try {
            let list = getFromLocalStorage();
            list = list.filter(d => d.id !== id);
            localStorage.setItem('cached_documents_v1', JSON.stringify(list));
        } catch (e) {}
    }

    return {
        save: saveDocument,
        getAll: getAllDocuments,
        get: getDocument,
        delete: deleteDocument,
        clear: clearAll
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentStorage;
}
