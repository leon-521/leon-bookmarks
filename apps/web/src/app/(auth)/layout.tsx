import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-bg-secondary bg-pattern">
      {/* Left decorative panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-accent overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid" />
        </div>
        <div className="relative z-10 max-w-md text-center px-8">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">
            Your team&apos;s bookmark hub
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Organize, share, and navigate your team&apos;s essential links with beautiful custom portals.
          </p>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
