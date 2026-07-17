import { useState } from "react";
import { Coffee } from "lucide-react";

export function BuyCoffeeButton() {
  const [loading, setLoading] = useState(false);

  const handleBuyCoffee = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Fetch SOL price from Jupiter
      const res = await fetch("https://api.jup.ag/price/v2?ids=SOL");
      const data = await res.json();
      const solPrice = Number(data.data.SOL.price);
      
      // Calculate $10 worth of SOL
      const amountInSol = (10 / solPrice).toFixed(4);
      
      // Trigger Solana Pay protocol which opens wallets like Phantom natively
      window.location.href = `solana:CRdAJC5JriJ64oHwqC5EJFEWr4DrcfsFeK4YDk17tLRD?amount=${amountInSol}&message=Buy%20me%20a%20coffee`;
    } catch (err) {
      console.error("Failed to fetch SOL price", err);
      // Fallback to rough estimate if fetch fails
      window.location.href = `solana:CRdAJC5JriJ64oHwqC5EJFEWr4DrcfsFeK4YDk17tLRD?amount=0.06&message=Buy%20me%20a%20coffee`;
    } finally {
      setLoading(false);
    }
  };

  return (
    <a
      href="#"
      onClick={handleBuyCoffee}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
    >
      <Coffee className="h-4 w-4" />
      {loading ? "Preparing..." : "Buy me a coffee ($10)"}
    </a>
  );
}
