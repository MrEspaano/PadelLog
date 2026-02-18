export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-accent-teal/20 via-transparent to-accent-purple/20" />
      {children}
    </main>
  );
}
