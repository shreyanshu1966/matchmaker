import { clearSession } from "@/lib/auth/session";
import { json } from "@/lib/auth/http";
import { withErrors } from "@/lib/auth/guard";

export const POST = withErrors(async () => {
  await clearSession();
  return json({ ok: true });
});
