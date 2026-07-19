import { contactInfo } from "../data";

export default function ContactPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-green-800/30 bg-[#111d15] p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.35em] text-green-300">
            Contact us
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Visit the shop or drop us a line
          </h1>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-green-800/20 bg-[#0d1710] p-6">
              <h2 className="text-xl font-semibold text-white">Shop details</h2>
              <ul className="mt-4 space-y-3 text-[#cbd8c2]">
                <li>
                  <span className="font-medium text-white">Address:</span>{" "}
                  {contactInfo.address}
                </li>
                <li>
                  <span className="font-medium text-white">Phone:</span>{" "}
                  {contactInfo.phone}
                </li>
                <li>
                  <span className="font-medium text-white">Email:</span>{" "}
                  {contactInfo.email}
                </li>
                <li>
                  <span className="font-medium text-white">Opening hours:</span>{" "}
                  {contactInfo.hours}
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-green-800/20 bg-[#0d1710] p-6">
              <h2 className="text-xl font-semibold text-white">
                What to expect
              </h2>
              <p className="mt-4 text-[#cbd8c2]">
                We keep the space welcoming for casual players, serious
                learners, and anyone looking for a table that feels right under
                the lights.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
