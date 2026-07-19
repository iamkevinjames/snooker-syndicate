import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1">
          <section className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="rounded-3xl border border-green-800/30 bg-[#111d15] p-8 shadow-2xl shadow-black/30 sm:p-10">
              <p className="text-sm uppercase tracking-[0.35em] text-green-300">
                Account access
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Login
              </h1>
            </div>
          </section>
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
