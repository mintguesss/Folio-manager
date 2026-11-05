package app.folio.notify;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;
import android.webkit.JavascriptInterface;

/** 網站（window.FolioApp）用來控制自動記帳。金鑰只能寫入、不能讀出，網址固定是自己的網站。 */
final class AppBridge {
    private final Context context;

    AppBridge(Context context) {
        this.context = context.getApplicationContext();
    }

    @JavascriptInterface
    public String getState() {
        return "{\"access\":" + hasAccess()
                + ",\"enabled\":" + Sender.enabled(context)
                + ",\"configured\":" + !Sender.url(context).isEmpty() + "}";
    }

    @JavascriptInterface
    public void setKey(String key) {
        Sender.prefs(context).edit().putString("url", MainActivity.BASE_URL + "/api/ingest?key=" + key).apply();
    }

    @JavascriptInterface
    public void setEnabled(boolean enabled) {
        Sender.prefs(context).edit().putBoolean("enabled", enabled).apply();
    }

    @JavascriptInterface
    public void openAccessSettings() {
        context.startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }

    @JavascriptInterface
    public String getLog() {
        return Sender.prefs(context).getString("log", "");
    }

    private boolean hasAccess() {
        String flat = Settings.Secure.getString(context.getContentResolver(), "enabled_notification_listeners");
        if (TextUtils.isEmpty(flat)) return false;
        return flat.contains(new ComponentName(context, NotifyService.class).flattenToString());
    }
}
