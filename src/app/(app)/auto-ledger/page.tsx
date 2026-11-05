import { AutoLedgerPanel } from "./AutoLedgerPanel";

export default function AutoLedgerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">自動記帳</h1>
        <p className="mt-1 text-sm text-zinc-400">付款通知會進一般記帳的「待確認」，確認後才入帳。</p>
      </div>
      <AutoLedgerPanel />
    </div>
  );
}
