import React from "react";
import InputOTPForm from "./InputOTPForm";
import { validateRequest } from "@/auth";

export default async function EmailVerifyPage() {
  const { user } = await validateRequest();

  const userId = user?.id;
  const email = user?.email
  return (
    <div className="mx-auto flex min-h-screen items-center justify-center bg-gray-100">
      <InputOTPForm userId={userId as string} email={email as string} />
    </div>
  );
}
