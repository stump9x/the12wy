import { LoaderCircle } from "lucide-react";

export function LoadingState() {
  return <div className="loading-state"><LoaderCircle className="spin" size={24} /><span>Đang chuẩn bị kế hoạch…</span></div>;
}
