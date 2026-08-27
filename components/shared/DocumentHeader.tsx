import { Firm } from "@/lib/types";

interface DocumentHeaderProps {
  firm: Firm;
  title: string;
  documentNumber?: string;
  date: string;
}

export default function DocumentHeader({
  firm,
  title,
  documentNumber,
  date,
}: DocumentHeaderProps) {
  return (
    <header className="border-b-2 border-gray-900 pb-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold">{firm.name}</h1>

          {firm.website && (
            <p className="text-sm text-gray-600">{firm.website}</p>
          )}

          <p className="text-sm text-gray-600">{firm.email}</p>
          <p className="text-sm text-gray-600">{firm.phone}</p>
        </div>

        <div className="text-right">
          <h2 className="text-xl font-bold uppercase">{title}</h2>

          <p className="mt-2 text-sm">
            <span className="font-semibold">No.:</span>{" "}
            {documentNumber}
          </p>

          <p className="text-sm">
            <span className="font-semibold">Date:</span> {date}
          </p>
        </div>
      </div>
    </header>
  );
}