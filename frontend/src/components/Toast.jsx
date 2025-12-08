import { useToast } from "./ToastContext";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function Toast() {
  const { toast } = useToast();

  if (!toast) return null;

  const isSuccess = toast.type === "success";

  return (
    <div
      className={`fixed gap-3 right-4 top-4 z-50 flex items-center rounded-lg px-4 py-2 text-base shadow-lg border ${
        isSuccess
          ? "bg-emerald-600 border-emerald-700 text-slate-50"
          : "bg-red-600 border-red-700 text-slate-50"
      }`}
    >
      {/* Ikoni */}
      {isSuccess ? (
        <CheckCircle className="h-5 w-5 text-white" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-white" />
      )}

      {/* Teksti */}
      <span>{toast.message}</span>
    </div>
  );
}
