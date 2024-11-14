import type { Session } from "lucia"
import { Google } from "arctic"
import { eq } from "drizzle-orm"

import type { DatabaseUserAttributes } from "../index.ts"
import { db } from "../../../../drizzle/index.ts"
import { User } from "../../../user/user.schema.ts"
import { CreateSessionError } from "../../auth.error.ts"
import { OAuthAccount } from "../../oauth.schema.ts"
import { lucia } from "../index.ts"

export const googleAuth = new Google(
  process.env.AUTH_GOOGLE_ID ?? "NOOP_NO_GOOGLE_ID",
  process.env.AUTH_GOOGLE_SECRET ?? "NOOP_NO_GOOGLE_SECRET",
  `${process.env.REDIRECT_URL}/auth/google/callback`,
)

export async function getGoogleAuthorizationUrl(
  state: string,
  codeVerifier: string,
): Promise<URL> {
  return await googleAuth.createAuthorizationURL(state, codeVerifier, {
    scopes: ["profile", "email"],
  })
}

interface GoogleUserResponse {
  sub: string
  name: string
  email: string
  email_verified: boolean
  picture: string
}
export async function createGoogleSession(
  idToken: string,
  codeVerifier: string,
  sessionToken?: string,
): Promise<CreateSessionError | Session> {
  const tokens = await googleAuth.validateAuthorizationCode(
    idToken,
    codeVerifier,
  )
  const user = (await (
    await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    })
  ).json()) as GoogleUserResponse

  const existingAccount = await db.query.OAuthAccount.findFirst({
    where: (account) => eq(account.providerUserId, user.sub),
  })
  let existingUser: DatabaseUserAttributes | null = null

  if (sessionToken) {
    const sessionUser = await lucia.validateSession(sessionToken)
    if (sessionUser.user) {
      existingUser = sessionUser.user as DatabaseUserAttributes
    }
  } else {
    const response = await db.query.User.findFirst({
      where: (_user) => eq(_user.email, user.email),
    })
    if (response) {
      existingUser = response
    }
  }

  if (existingUser?.emailVerified && user.email_verified && !existingAccount) {
    await db.insert(OAuthAccount).values({
      providerUserId: user.sub,
      provider: "google",
      userId: existingUser.id,
    })
    return await lucia.createSession(existingUser.id, {})
  }
  if (existingAccount) {
    return await lucia.createSession(existingAccount.userId, {})
  } else {
    const [insertedUser] = await db
      .insert(User)
      .values({
        fullName: user.name,
        email: user.email,
        emailVerified: user.email_verified ? new Date() : null,
        imageUrl: user.picture,
      })
      .returning()

    if (!insertedUser)
      return new CreateSessionError("Failed to insert new user into database")

    await db.insert(OAuthAccount).values({
      providerUserId: user.sub,
      provider: "google",
      userId: insertedUser.id,
    })
    return await lucia.createSession(insertedUser.id, {})
  }
}