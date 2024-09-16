"use server";

import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verify } from "@node-rs/argon2";
import { lucia, validateRequest } from "@/auth";
import { db } from "@/db";
import { tokensTable, userTable } from "@/db/schema";
import {
  signUpSchema,
  SignUpValues,
  loginSchema,
  LoginValues,
  TokenValues,
  tokenSchema,
} from "@/lib/validations";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
import { generatePlaceholderName, generateSixDigitCode } from "@/lib/utils";

export async function signUpAction(
  values: SignUpValues,
): Promise<{ error: string }> {
  try {
    const { email, password } = signUpSchema.parse(values);

    const hashedPassword = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const emailExist = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (emailExist) {
      return {
        error: "Email already taken",
      };
    }

    const userId = generateIdFromEntropySize(10);
    const dbEmail = email.trim();

    const name = await generatePlaceholderName(dbEmail);

    await db.insert(userTable).values({
      id: userId,
      email: dbEmail,
      password: hashedPassword,
      name,
    });

    const token = await generateSixDigitCode();
    const tokenId = generateIdFromEntropySize(10);

    await db.insert(tokensTable).values({
      id: tokenId,
      token,
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in milliseconds
      lastSentAt: new Date(),
    });
    //TODO: Send Email

    //Create session for better User experience even if no email has been verified as yet
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return redirect("/email-verify");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: "An error occured. Please try again.",
    };
  }
}

export async function emailVerifyAction(
  values: TokenValues,
): Promise<{ error: string }> {
  try {
    const { userId, token } = tokenSchema.parse(values);

    const emailTokenResult = await db.query.tokensTable.findFirst({
      where: eq(tokensTable.userId, userId) && eq(tokensTable.token, token),
    });

    if (!emailTokenResult) {
      return { error: "Invalid code" };
    }

    // Check if the token has expired
    const currentTime = new Date();
    if (currentTime > emailTokenResult.expiresAt) {
      await db.delete(tokensTable).where(eq(tokensTable.token, token));
      return { error: "Token has expired" };
    }

    // Update User Table
    await db
      .update(userTable)
      .set({
        emailVerified: true,
      })
      .where(eq(userTable.id, userId));

    // Delete token to maintain a clean state of verifications between email  vs Password
    await db.delete(tokensTable).where(eq(tokensTable.token, token));

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;

    console.error("Token error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function resendEmailVerifyAction(
  email: string,
): Promise<{ error: string; success: string }> {
  try {
    const user = await db.query.userTable.findFirst({
      where: (table) => eq(table.email, email),
    });

    if (!user) {
      return {
        error: "User not found",
        success: "",
      };
    }

    if (user.emailVerified === true) {
      return {
        error: "Email already verified",
        success: "",
      };
    }

    const tokenExist = await db.query.tokensTable.findFirst({
      where: eq(tokensTable.userId, user.id),
    });

    if (!tokenExist) {
      return {
        error: "No token found",
        success: "",
      };
    }

    // Rate Limit token resends to 1 minute
    const currentTime = new Date();
    const lastSentAt = tokenExist.lastSentAt;

    if (lastSentAt) {
      const sentAt = new Date(lastSentAt);
      const timeElapsed = currentTime.getTime() - sentAt.getTime();
      const oneMinute = 60000; // 1 minute in milliseconds

      if (timeElapsed < oneMinute) {
        const secondsLeft = Math.ceil((oneMinute - timeElapsed) / 1000);
        return {
          error: `Please wait ${secondsLeft} more seconds before resending the code.`,
          success: "",
        };
      }
    }

    const token = await generateSixDigitCode();

    await db
      .update(tokensTable)
      .set({
        token,
        lastSentAt: new Date(),
      })
      .where(eq(tokensTable.userId, user.id));

    //TODO: Send email

    return {
      error: "", // No error means success
      success: "Code email sent successfully", // Add success message
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;

    console.error("Token error:", error);
    return { error: "Something went wrong. Please try again.", success: "" };
  }
}


//TODO: Implement Rate limiting based on email address & IP
export async function loginAction(
  values: LoginValues,
): Promise<{ error: string }> {
  try {
    const { email, password } = loginSchema.parse(values);

    const user = await db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (!user) {
      return { error: "Wrong email or password" };
    }

    const isPasswordValid = await verify(user.password, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!isPasswordValid) {
      return { error: "Wrong email or password" };
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;

    console.error("Login error:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function logoutAction(): Promise<{ error: string }> {
  const { session } = await validateRequest();
  if (!session) {
    return {
      error: "Unauthorized",
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect("/");
}
