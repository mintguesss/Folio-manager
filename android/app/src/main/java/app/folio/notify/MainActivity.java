package app.folio.notify;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/** 設定畫面：貼網址、開通知權限、看最近送出的紀錄 */
public class MainActivity extends Activity {
    private TextView status;
    private TextView logView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        int pad = dp(16);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad * 2, pad, pad);

        TextView header = new TextView(this);
        header.setText("Folio 自動記帳");
        header.setTextSize(22);
        header.setTypeface(Typeface.DEFAULT_BOLD);
        root.addView(header);

        status = new TextView(this);
        status.setPadding(0, dp(8), 0, dp(12));
        root.addView(status);

        TextView urlLabel = new TextView(this);
        urlLabel.setText("網址（一般記帳頁「手機通知自動記帳設定」產生的那串）");
        root.addView(urlLabel);

        EditText url = new EditText(this);
        url.setSingleLine(true);
        url.setHint("https://…/api/ingest?key=…");
        url.setText(Sender.url(this));
        root.addView(url, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        Button save = new Button(this);
        save.setText("儲存網址");
        save.setOnClickListener(v -> {
            String u = url.getText().toString().trim();
            Sender.prefs(this).edit().putString("url", u).apply();
            Toast.makeText(this, "已儲存", Toast.LENGTH_SHORT).show();
            refresh();
        });
        root.addView(save);

        Button perm = new Button(this);
        perm.setText("開啟通知存取權");
        perm.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)));
        root.addView(perm);

        Button test = new Button(this);
        test.setText("測試連線");
        test.setOnClickListener(v -> {
            Sender.send(this, "測試", "Folio 測試連線");
            Toast.makeText(this, "已送出，幾秒後看下面紀錄", Toast.LENGTH_SHORT).show();
            v.postDelayed(this::refresh, 3000);
        });
        root.addView(test);

        TextView logLabel = new TextView(this);
        logLabel.setText("最近紀錄");
        logLabel.setTypeface(Typeface.DEFAULT_BOLD);
        logLabel.setPadding(0, dp(16), 0, dp(4));
        root.addView(logLabel);

        logView = new TextView(this);
        logView.setTextSize(12);
        logView.setTextIsSelectable(true);
        root.addView(logView);

        ScrollView scroll = new ScrollView(this);
        scroll.addView(root);
        setContentView(scroll);
    }

    @Override
    protected void onResume() {
        super.onResume();
        refresh();
    }

    private void refresh() {
        boolean granted = hasAccess();
        boolean hasUrl = !Sender.url(this).isEmpty();
        String s = (granted ? "✅ 通知存取權已開啟" : "❌ 還沒開通知存取權") + "\n"
                + (hasUrl ? "✅ 網址已設定" : "❌ 還沒設定網址");
        status.setText(s);
        String log = Sender.prefs(this).getString("log", "");
        logView.setText(log.isEmpty() ? "（還沒有紀錄）" : log);
    }

    private boolean hasAccess() {
        String flat = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        if (TextUtils.isEmpty(flat)) return false;
        String me = new ComponentName(this, NotifyService.class).flattenToString();
        return flat.contains(me);
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
