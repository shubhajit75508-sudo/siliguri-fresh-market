import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-extrabold text-foreground">404</h1>
      <p className="mt-2 text-lg text-muted">Page not found</p>
      <Button variant="fresh" className="mt-6" asChild>
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
}
