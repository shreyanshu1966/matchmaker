import { resetDemoData } from "@/lib/db";
import { json } from "@/lib/auth/http";
import { withMatchmaker } from "@/lib/auth/guard";

export const POST = withMatchmaker(async () => {
  await resetDemoData();
  return json({ ok: true });
});
