"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import LoadingBtn from "@/components/LoadingBtn";
import { useState, useTransition } from "react";
import { tokenSchema, TokenValues } from "@/lib/validations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emailVerifyAction, resendEmailVerifyAction } from "../(auth)/actions";
import useCountdown from "@/hooks/use-countdown";

export default function InputOTPForm({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const { seconds, startCountdown } = useCountdown();

  const form = useForm<TokenValues>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      token: "",
      userId,
    },
  });

  async function onSubmit(values: TokenValues) {
    setError(undefined);
    startTransition(async () => {
      const { error } = await emailVerifyAction(values);
      startCountdown(60);
      if (error) setError(error);
    });
  }

  async function resendToken(email: string) {
    console.log("Ko how far");

    setError(undefined);
    setSuccess(undefined);
    startTransition(async () => {
      const { error, success } = await resendEmailVerifyAction(email);
      if (error) {
        setError(error);
        toast({
          variant: "destructive",
          title: `${error}`,
        });
      }

      if (success) {
        setSuccess(success);
        toast({
          title: `Token email sent`,
        });
      }
    });
  }

  return (
    <Card className="max-w-96 rounded-md p-5 shadow-sm">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-6"
        >
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="hidden" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>One-Time Code</FormLabel>
                <FormControl>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormDescription>
                  Please enter the one-time confirmation code sent to {email}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-center text-destructive">{error}</p>}
          {success && <p className="text-center text-green-600">{success}</p>}
          <Button
            disabled={seconds > 0 && seconds < 60}
            type="button"
            variant="link"
            onClick={() => resendToken(email)}
          >
            Resend Code: {seconds}
          </Button>

          <LoadingBtn loading={isPending} className="w-full" type="submit">
            Next
          </LoadingBtn>
        </form>
      </Form>
    </Card>
  );
}
