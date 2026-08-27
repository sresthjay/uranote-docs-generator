import { Firm } from "@/lib/types";

interface DocumentFooterProps {
  firm: Firm;
}

export default function DocumentFooter({
  firm,
}: DocumentFooterProps) {
  return (
    <footer className="mt-8 border-t border-gray-300 pt-4 text-center">
      {firm.issuedBy && (
        <p className="text-sm font-semibold">{firm.issuedBy}</p>
      )}

      <p className="mt-2 text-sm text-gray-600">
        {firm.thankYouMessage}
      </p>
    </footer>
  );
}