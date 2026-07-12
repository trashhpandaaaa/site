import { SignUp } from "@clerk/nextjs";

import AuthShell from "../../components/AuthShell";
import { clerkAppearance } from "../../../lib/clerkAppearance";

export const metadata = {
  title: "Join KastoChha - Nepal's Curious Community Network"
};

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp path="/sign-up" signInUrl="/sign-in" appearance={clerkAppearance} />
    </AuthShell>
  );
}
