"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h1 className="mt-6 text-2xl font-bold">Что-то пошло не так</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Произошла ошибка при загрузке страницы. Попробуйте обновить.
      </p>
      <Button onClick={reset} className="mt-6 rounded-full">
        Попробовать снова
      </Button>
    </div>
  );
}
