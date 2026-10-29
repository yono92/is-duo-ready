/** Extract only after the exact access token was verified by Supabase getUser(token). */
export function verifiedSessionId(token, userId) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.sub === userId &&
      /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(payload.session_id)
      ? payload.session_id
      : null;
  } catch {
    return null;
  }
}

export async function liveHostedSession(db, sessionId, userId) {
  if (!sessionId) return false;
  const result = await db.query(
    'SELECT EXISTS(SELECT 1 FROM auth.sessions WHERE id=$1 AND user_id=$2 AND (not_after IS NULL OR not_after > now())) AS active',
    [sessionId, userId],
  );
  return result.rows[0]?.active === true;
}
