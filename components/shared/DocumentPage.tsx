interface DocumentPageProps {
  children: React.ReactNode;
}

export default function DocumentPage({
  children,
}: DocumentPageProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-white px-6 py-8 text-gray-900 print:max-w-none print:px-8 print:py-6">
      {children}
    </main>
  );
}