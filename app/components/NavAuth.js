"use client";

import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";

export default function NavAuth() {
  const { user } = useUser();
  const role = (user?.publicMetadata?.role || "user").toString();
  const isAdmin = role === "admin" || role === "super_admin";

  return (
    <div className="nav-auth">
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="btn-outline">Sign in</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        {isAdmin ? (
          <a className="btn-outline nav-admin-link" href="/admin">Admin</a>
        ) : null}
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  );
}
