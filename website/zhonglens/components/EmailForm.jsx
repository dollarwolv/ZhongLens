"use client";

import { useState } from "react";
import { SquareLoader } from "react-spinners";

function EmailForm() {
  const [email, setEmail] = useState("");
  const [successEmail, setSuccessEmail] = useState("");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    setLoading(true);
    e.preventDefault();
    const res = await fetch("/api/waitlist", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    const resJson = await res.json();

    console.log(resJson);

    if (!resJson.ok) {
      setError(res.error);
      return;
    }

    if (!resJson.sent) {
      setAlreadyRegistered(true);
    }

    setSuccessEmail(resJson.data[0].email);
    setLoading(false);
  }

  return (
    <section
      className="mx-auto max-w-4xl px-6 md:pt-32 md:pb-[30vh] pt-12 pb-40 text-center"
      id="waitlist"
    >
      <h2 className="mb-6 text-4xl font-bold">Be the first to try ZhongLens</h2>
      <p className="mb-10 text-lg opacity-60">
        We&#39;re rolling out access to a limited group of beta testers soon.
      </p>

      <form
        className="mx-auto mb-6 flex max-w-md flex-col gap-3 sm:flex-row"
        onSubmit={(e) => e.preventDefault()}
      >
        {successEmail ? (
          <div className="flex flex-col">
            {alreadyRegistered ? (
              <>
                <h2 className="text-2xl">Already subscribed!</h2>
                <p>
                  Your email {successEmail} is already subscribed. Nothing has
                  changed.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl">Thank you!</h2>
                <p>
                  Your email {successEmail} was successfully submitted. Once
                  ZhongLens is ready, you will be invited to try it out.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <input
              className="flex-1 rounded-xl bg-white px-5 py-4 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-black/20"
              placeholder="Enter your email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="cursor-pointer whitespace-nowrap rounded-xl bg-black px-8 py-4 font-bold text-white transition-all hover:opacity-90"
              type="submit"
              onClick={(e) => {
                handleSubmit(e);
              }}
            >
              {loading ? (
                <SquareLoader color="white" size={12} />
              ) : (
                "Join Waitlist"
              )}
            </button>
          </>
        )}
      </form>

      <span className="text-xs text-red-500">{error}</span>
      <p className="text-xs opacity-40">
        No spam. We&apos;ll only email you when early access is available.
      </p>
    </section>
  );
}

export default EmailForm;
