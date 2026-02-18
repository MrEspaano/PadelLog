export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="court-lines relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-padel-blue/20 via-transparent to-padel-blue-soft/15" />
      {children}
    </main>
  );
}
