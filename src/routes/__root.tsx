import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BuyCoffeeButton } from "../components/BuyCoffeeButton";
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-vs">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Off the pitch</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This route isn't in the arena.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-sky"
          >
            Back to arena
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-xl p-8">
        <h1 className="text-xl font-semibold">The arena glitched</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm font-semibold">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AgentVS — Vibe-code betting agents and battle" },
      { name: "description", content: "Build prediction-market agents with drag-and-drop rules or import your own, then pit them head-to-head against other players." },
      { property: "og:title", content: "AgentVS — Agent vs Agent Prediction Battles" },
      { property: "og:description", content: "Vibe-code your betting agent and send it into the arena." },
      { property: "og:image", content: "/txodds.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" },
      { rel: "icon", href: "/txodds.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-full glass px-5 py-2.5">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/txodds.png" alt="TXOdds" className="h-6 w-6 rounded-full" />
            <span className="text-sm font-semibold tracking-tight">agent<span className="text-gradient-vs">vs</span></span>
          </Link>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/build" className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "bg-secondary/70 text-foreground" }}>Build</Link>
          <Link to="/backtest" className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "bg-secondary/70 text-foreground" }}>Backtest</Link>
          <Link to="/vs" className="ml-2 rounded-full bg-primary px-3.5 py-1.5 text-primary-foreground shadow-sm hover:opacity-90">Arena</Link>
          
          <div className="ml-4 pl-4 border-l border-border/50 flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-border/40 py-8 text-center">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
           <img src="/txodds.png" alt="TXOdds" className="h-5 w-5 rounded-full" />
           <span className="font-semibold">Powered by TXOdds</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
        <a href="https://x.com/mishastastna" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <img src="/dev-pfp.jpg" alt="Dev" className="h-6 w-6 rounded-full object-cover" />
          <span>Follow the dev! Misha Stastna</span>
        </a>
        <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
        <BuyCoffeeButton />
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  
  // Get clerk key from env - standard Vite way
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
  
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <Nav />
        <div className="min-h-[calc(100vh-140px)]">
          <Outlet />
        </div>
        <Footer />
        <Toaster theme="light" position="top-center" />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
