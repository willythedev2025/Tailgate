import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/home");

  const { callbackUrl } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-headline text-5xl font-black tracking-tight mb-1" style={{ color: "var(--color-text)" }}>
            CLUB<span style={{ color: "var(--color-accent)" }}>HOUSE</span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Sports pools for your crew
          </p>
        </div>

        {/* Auth buttons */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-center mb-2">Sign in to play</h2>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl ?? "/home" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "#fff", color: "#1a1a1a", border: "1px solid var(--color-border)" }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)" }}>
                or
              </span>
            </div>
          </div>

          <MagicLinkForm callbackUrl={callbackUrl ?? "/home"} />
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--color-text-dim)" }}>
          By signing in you agree to play fair and not cry when you lose.
        </p>
      </div>
    </div>
  );
}

function MagicLinkForm({ callbackUrl }: { callbackUrl: string }) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const email = formData.get("email") as string;
        await signIn("resend", { email, redirectTo: callbackUrl });
      }}
      className="space-y-3"
    >
      <input
        name="email"
        type="email"
        placeholder="your@email.com"
        required
        className="w-full px-4 py-3 rounded-lg text-sm outline-none focus:ring-2 transition-all"
        style={{
          backgroundColor: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
        }}
      />
      <button
        type="submit"
        className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all hover:opacity-90"
        style={{ backgroundColor: "var(--color-accent)" }}
      >
        Send magic link
      </button>
    </form>
  );
}
