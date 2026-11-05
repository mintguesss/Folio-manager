package app.folio.notify;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

/** 全螢幕開網站；自己網站以外的連結交給瀏覽器 */
public class MainActivity extends Activity {
    static final String BASE_URL = "https://folio-manager-roan.vercel.app";
    private static final int BACKGROUND = 0xFF09090B;
    private static final String OFFLINE_PAGE =
            "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>"
                    + "<body style='margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;"
                    + "justify-content:center;gap:16px;background:#09090b;color:#d4d4d8;font-family:sans-serif'>"
                    + "<p>連不上網路</p><a style='color:#38bdf8' href='" + BASE_URL + "/dashboard'>重試</a>";

    private WebView web;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        web.setBackgroundColor(BACKGROUND);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setTextZoom(100);
        CookieManager.getInstance().setAcceptCookie(true);
        web.addJavascriptInterface(new AppBridge(this), "FolioApp");
        web.setWebChromeClient(new WebChromeClient());
        web.setDownloadListener((url, ua, disposition, mime, length) -> openExternal(Uri.parse(url)));
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (Uri.parse(BASE_URL).getHost().equals(uri.getHost())) return false;
                openExternal(uri);
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    view.loadDataWithBaseURL(BASE_URL, OFFLINE_PAGE, "text/html", "UTF-8", null);
                }
            }
        });

        // Android 15 起畫面會延伸到狀態列和鍵盤底下，自己留出空間
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(BACKGROUND);
        root.addView(web);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            // 這裡留過就不再往下傳，否則網頁的 safe-area-inset 會再留一次，頂部多一塊空白
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    ? WindowInsets.CONSUMED
                    : insets.consumeSystemWindowInsets();
        });
        setContentView(root);

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(BASE_URL + "/dashboard");
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) {
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        // 從系統設定回來時，讓網站重新讀權限狀態
        web.evaluateJavascript("window.dispatchEvent(new Event('folio-app-state'))", null);
    }

    @Override
    protected void onPause() {
        web.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
