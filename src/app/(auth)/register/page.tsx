import { redirect } from "next/navigation";

// No separate registration needed — first magic-link login creates your account automatically.
export default function RegisterPage() {
  redirect("/login");
}
