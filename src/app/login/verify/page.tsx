export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-6">📬</div>
        <h1 className="text-2xl font-black text-headline mb-3">Check your email</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          We sent you a magic link. Tap it to sign in — no password needed.
        </p>
        <p className="text-sm mt-4" style={{ color: "var(--color-text-dim)" }}>
          Link expires in 10 minutes.
        </p>
      </div>
    </div>
  );
}
