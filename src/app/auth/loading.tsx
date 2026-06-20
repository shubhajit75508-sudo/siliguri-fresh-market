import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1b2a]">
      <Loader2 className="h-6 w-6 animate-spin text-[#5a7278]" />
    </div>
  );
}
