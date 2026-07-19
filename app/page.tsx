import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-green-800/40 bg-[#0e1a12] p-8 shadow-2xl shadow-black/30 sm:p-12">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-green-300">
            Snooker Syndicate shop
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold text-white sm:text-5xl">
            A compact hub for cue sports fans, table buyers, and weekend
            challengers.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[#cbd8c2]">
            We keep things simple here: tables, coaching, and the kind of gear
            that makes an 8-ball session feel sharp from the first rack.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/tournament"
              className="rounded-full bg-green-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-green-500"
            >
              Browse tournaments
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-green-700 px-5 py-3 text-sm font-medium text-[#dff5d6] transition hover:border-green-500"
            >
              Visit the shop
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-green-800/30 bg-[#111d15] p-6">
            <h2 className="text-2xl font-semibold text-white">
              Why 8-Ball Pool is so popular
            </h2>
            <p className="mt-4 text-[#cbd8c2]">
              The rules are easy to learn, the pace stays lively, and every rack
              has a little drama. That is why players keep coming back for
              casual nights and serious practice.
            </p>
            <p className="mt-4 text-[#cbd8c2]">
              Our shop focuses on 8-ball tables, coaching setups, and starter
              gear that helps new players learn without feeling overwhelmed.
            </p>
          </article>
          <article className="rounded-2xl border border-green-800/30 bg-[#111d15] p-6">
            <h2 className="text-2xl font-semibold text-white">
              A quick note on snooker
            </h2>
            <p className="mt-4 text-[#cbd8c2]">
              Snooker is the older cousin of the cue sport world, with deeper
              tactics and a slower rhythm. We still keep an eye on it because
              many of our regulars enjoy both games.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
