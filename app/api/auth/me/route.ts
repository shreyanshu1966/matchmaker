import { json } from "@/lib/auth/http";
import { withMatchmaker } from "@/lib/auth/guard";

export const GET = withMatchmaker(async (_request, { session }) => {
  return json({ user: { id: session.id, name: session.name, username: session.username } });
});
