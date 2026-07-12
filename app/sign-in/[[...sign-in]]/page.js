import { SignIn } from "@clerk/nextjs";

import AuthShell from "../../components/AuthShell";
import { clerkAppearance } from "../../../lib/clerkAppearance";

export const metadata = {
  title: "Sign in - KastoChha"
};

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn path="/sign-in" signUpUrl="/sign-up" appearance={clerkAppearance} />
    </AuthShell>
  );
}
