package de.lauri.dokumentenbetrachter;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {
    private String pendingDocName = null;
    private String pendingDocBase64 = null;
    private long pendingDocSize = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Javascript-Interface an den WebView anbinden
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new DocumentBridge(), "AndroidDocumentOpener");
        }

        // Eingehenden Intent beim Start verarbeiten
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action) || Intent.ACTION_EDIT.equals(action) || Intent.ACTION_SEND.equals(action)) {
            Uri uri = intent.getData();
            if (uri == null && intent.getClipData() != null && intent.getClipData().getItemCount() > 0) {
                uri = intent.getClipData().getItemAt(0).getUri();
            }
            if (uri == null && Intent.ACTION_SEND.equals(action)) {
                uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            }

            if (uri != null) {
                readFileFromUri(uri);
            }
        }
    }

    private void readFileFromUri(Uri uri) {
        try {
            String fileName = "dokument";
            long fileSize = 0;

            try (Cursor cursor = getContentResolver().query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (nameIndex != -1) {
                        fileName = cursor.getString(nameIndex);
                    }
                    int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
                    if (sizeIndex != -1) {
                        fileSize = cursor.getLong(sizeIndex);
                    }
                }
            } catch (Exception ignored) {
            }

            if (fileName == null || fileName.isEmpty()) {
                fileName = uri.getLastPathSegment();
            }
            if (fileName == null || fileName.isEmpty()) {
                fileName = "dokument";
            }

            try (InputStream is = getContentResolver().openInputStream(uri)) {
                if (is == null) return;

                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] chunk = new byte[8192];
                int nRead;
                while ((nRead = is.read(chunk, 0, chunk.length)) != -1) {
                    buffer.write(chunk, 0, nRead);
                }

                byte[] bytes = buffer.toByteArray();
                if (fileSize <= 0) {
                    fileSize = bytes.length;
                }

                String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);

                this.pendingDocName = fileName;
                this.pendingDocBase64 = base64;
                this.pendingDocSize = fileSize;

                // Wenn WebView bereits läuft, direkt pushen
                if (getBridge() != null && getBridge().getWebView() != null) {
                    final String finalName = fileName;
                    final String finalBase64 = base64;
                    getBridge().getWebView().post(new Runnable() {
                        @Override
                        public void run() {
                            String js = "if (window.onAndroidDocumentReceived) { window.onAndroidDocumentReceived("
                                    + JSONObject.quote(finalName) + ", "
                                    + JSONObject.quote(finalBase64) + "); }";
                            getBridge().getWebView().evaluateJavascript(js, null);
                        }
                    });
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public class DocumentBridge {
        @JavascriptInterface
        public String getPendingDocument() {
            if (pendingDocBase64 != null) {
                try {
                    JSONObject json = new JSONObject();
                    json.put("name", pendingDocName);
                    json.put("base64", pendingDocBase64);
                    json.put("size", pendingDocSize);
                    pendingDocBase64 = null; // Nach Abruf leeren
                    return json.toString();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            return null;
        }
    }
}
