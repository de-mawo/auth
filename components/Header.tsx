import React from "react";
import UserButton from "./UserButton";


export default function Header() {
  return (
    <header className="bg-background flex items-center justify-between p-4">
      <h1 className="text-2xl font-bold">Your App Name</h1>
      <UserButton />
    </header>
  );
}
