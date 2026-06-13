"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. http on a phone) — leave the link selectable
    }
  };

  return (
    <Button type="button" variant="primary" size="md" className="w-full" onClick={handleCopy}>
      {copied ? "✓ Copied" : "Copy invite link"}
    </Button>
  );
}
