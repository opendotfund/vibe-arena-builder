import { useState } from "react";
import { Coffee, Check } from "lucide-react";
import { toast } from "sonner";

export function BuyCoffeeButton() {
  const [copied, setCopied] = useState(false);
  const address = "CRdAJC5JriJ64oHwqC5EJFEWr4DrcfsFeK4YDk17tLRD";

  const handleBuyCoffee = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success(`Solana address copied: ${address}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleBuyCoffee}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
    >
      {copied ? <Check className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
      {copied ? "Address copied!" : "Buy me a coffee"}
    </button>
  );
}
