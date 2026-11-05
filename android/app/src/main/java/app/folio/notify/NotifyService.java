package app.folio.notify;

import android.app.Notification;
import android.os.Bundle;
import android.os.Parcelable;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 收到任何通知時，把標題和所有文字欄位（含 LINE 用的對話格式）讀出來；
 * 看起來像付款的才送到網站，其他的不送。
 */
public class NotifyService extends NotificationListenerService {
    /** 和網站的判斷一致：要有付款相關的字和數字 */
    private static final Pattern PAY = Pattern.compile(
            "消費|刷卡|付款|支付|扣款|交易|授權|Purchase|Payment", Pattern.CASE_INSENSITIVE);
    private static final Pattern DIGIT = Pattern.compile("\\d");

    /** 同一則通知會因為更新被送好幾次，記住最近送過的內容 */
    private final Map<String, Long> recent = new LinkedHashMap<String, Long>() {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Long> e) {
            return size() > 50;
        }
    };

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn.getPackageName().equals(getPackageName()) || !Sender.enabled(this)) return;
        Notification n = sbn.getNotification();
        if ((n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;

        Bundle ex = n.extras;
        String title = str(ex.getCharSequence(Notification.EXTRA_TITLE));
        if (title.isEmpty()) title = str(ex.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE));

        List<String> parts = new ArrayList<>();
        add(parts, ex.getCharSequence(Notification.EXTRA_TEXT));
        add(parts, ex.getCharSequence(Notification.EXTRA_BIG_TEXT));
        CharSequence[] lines = ex.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
        if (lines != null) for (CharSequence l : lines) add(parts, l);
        // LINE 的訊息放在對話格式裡
        Parcelable[] msgs = ex.getParcelableArray(Notification.EXTRA_MESSAGES);
        if (msgs != null) {
            for (Parcelable p : msgs) {
                if (p instanceof Bundle) add(parts, ((Bundle) p).getCharSequence("text"));
            }
        }
        add(parts, ex.getCharSequence(Notification.EXTRA_SUB_TEXT));
        add(parts, ex.getCharSequence(Notification.EXTRA_SUMMARY_TEXT));
        add(parts, n.tickerText);

        String text = String.join("\n", parts);
        String all = title + "\n" + text;
        if (!PAY.matcher(all).find() || !DIGIT.matcher(all).find()) return;

        String sig = title + "|" + text;
        long now = System.currentTimeMillis();
        synchronized (recent) {
            Long last = recent.get(sig);
            if (last != null && now - last < 10 * 60_000) return;
            recent.put(sig, now);
        }
        Sender.send(this, title, text, sbn.getPackageName());
    }

    private static String str(CharSequence cs) {
        return cs == null ? "" : cs.toString().trim();
    }

    private static void add(List<String> parts, CharSequence cs) {
        String s = str(cs);
        if (s.isEmpty()) return;
        for (String p : parts) if (p.contains(s)) return;
        parts.add(s);
    }
}
