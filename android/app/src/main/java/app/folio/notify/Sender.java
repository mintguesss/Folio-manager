package app.folio.notify;

import android.content.Context;
import android.content.SharedPreferences;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** 把通知送到網站的 /api/ingest，並把結果記在 App 裡的紀錄 */
final class Sender {
    private static final ExecutorService POOL = Executors.newSingleThreadExecutor();
    private static final int MAX_LOG_LINES = 40;

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("folio", Context.MODE_PRIVATE);
    }

    static String url(Context c) {
        return prefs(c).getString("url", "");
    }

    static void send(Context c, String title, String text) {
        final Context app = c.getApplicationContext();
        final String target = url(app);
        if (target.isEmpty()) {
            log(app, "還沒設定網址，略過：" + title);
            return;
        }
        POOL.execute(() -> {
            String result;
            try {
                result = post(target, title, text);
            } catch (Exception e) {
                // 網路不通時等 20 秒再試一次
                try {
                    Thread.sleep(20_000);
                    result = post(target, title, text);
                } catch (Exception e2) {
                    result = "送出失敗：" + e2.getMessage();
                }
            }
            log(app, title + "｜" + oneLine(text) + "\n  → " + result);
        });
    }

    private static String post(String target, String title, String text) throws Exception {
        String body = "title=" + URLEncoder.encode(title, "UTF-8") + "&text=" + URLEncoder.encode(text, "UTF-8");
        HttpURLConnection conn = (HttpURLConnection) new URL(target).openConnection();
        conn.setRequestMethod("POST");
        conn.setConnectTimeout(15_000);
        conn.setReadTimeout(15_000);
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }
        int code = conn.getResponseCode();
        InputStream is = code < 400 ? conn.getInputStream() : conn.getErrorStream();
        String resp = is == null ? "" : readAll(is);
        conn.disconnect();
        return code + " " + resp;
    }

    private static String readAll(InputStream is) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = is.read(buf)) > 0) out.write(buf, 0, n);
        is.close();
        return out.toString("UTF-8");
    }

    private static String oneLine(String s) {
        String t = s.replace('\n', ' ');
        return t.length() > 60 ? t.substring(0, 60) + "…" : t;
    }

    static synchronized void log(Context c, String line) {
        String time = new SimpleDateFormat("MM/dd HH:mm:ss", Locale.TAIWAN).format(new Date());
        String prev = prefs(c).getString("log", "");
        String all = time + " " + line + "\n" + prev;
        String[] lines = all.split("\n");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(lines.length, MAX_LOG_LINES); i++) sb.append(lines[i]).append('\n');
        prefs(c).edit().putString("log", sb.toString()).apply();
    }
}
