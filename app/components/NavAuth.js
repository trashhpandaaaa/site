"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

// Admin stays reachable at /admin directly (server-side role gate);
// it is intentionally not linked from the nav.
export default function NavAuth() {
  return (
    <div className="nav-auth">
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="btn-outline">Sign in</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
