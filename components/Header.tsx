import React from "react";
import UserButton from "./user-button";
import { validateRequest } from "@/auth";
import { User } from "lucia";
import { Button } from "./ui/button";
import Link from "next/link";

export default async function Header() {
  const { user } = await validateRequest();

  return (
    <header className="flex items-center justify-between bg-background p-4">
      <h1 className="text-2xl font-bold">De Mawo</h1>
      {user ? (
        <UserButton user={user as User} />
      ) : (
        <div className="flex space-x-3">
          <Button asChild variant="secondary">
            <Link href="/login" className="font-semibold">
              Login
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/sign-up" className="font-semibold">
              Sign Up
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
