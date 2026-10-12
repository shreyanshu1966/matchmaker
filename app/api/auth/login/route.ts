import bcrypt from "bcryptjs";
import { z } from "zod";
import { getMatchmakerByUsername } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { errorResponse, json, parseBody } from "@/lib/auth/http";
import { withErrors } from "@/lib/auth/guard";

const LoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required").max(200),
});

// Compared against when the user does not exist, so response timing does not reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);
const INVALID = "Invalid username or password";

export const POST = withErrors(async (request) => {
  const { username, password } = await parseBody(request, LoginSchema);
  const matchmaker = await getMatchmakerByUsername(username.toLowerCase());
  const ok = await bcrypt.compare(password, matchmaker?.passwordHash ?? DUMMY_HASH);
  if (!matchmaker || !ok) return errorResponse(401, INVALID);

  const user = { id: matchmaker.id, name: matchmaker.name, username: matchmaker.username };
  await createSession(user);
  return json({ user });
});
