import Image from "next/image";
import EmailForm from "../components/EmailForm";
import { Keyboard, Brain, SquareMousePointer } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-zhonglens-white text-black">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <Image
            src="/icon_zi_full.png"
            width={64}
            height={64}
            alt="ZhongLens logo"
          />
          <span className="text-xl font-bold tracking-tight">ZhongLens</span>
        </div>

        <div className="flex items-center md:gap-8 gap-2">
          <a
            className="text-sm font-medium opacity-70 transition-opacity hover:opacity-100"
            href="#how-it-works"
          >
            How it works
          </a>
          <a
            className="text-sm font-medium opacity-70 transition-opacity hover:opacity-100"
            href="#use-cases"
          >
            Use Cases
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 pb-24 pt-16 text-center">
        <h1 className="mb-8 text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl">
          <span>Use A Pop-Up Dictionary </span>
          <span className="italic opacity-40">Anywhere.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-3xl text-xl font-normal leading-relaxed opacity-70 md:text-2xl">
          An AI-powered Chrome extension that scans images, videos, and PDFs to
          make unselectable Chinese characters interactive.
        </p>

        <div className="mb-20 flex flex-col items-center justify-center gap-6 sm:flex-row">
          <a
            className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-black shadow-lg shadow-black/5 transition-all hover:opacity-90"
            href="#waitlist"
          >
            Join the Waitlist
          </a>
        </div>

        <div className="group relative">
          <div className="absolute -inset-1 rounded-4xl bg-linear-to-r from-gray-200 to-gray-300 blur opacity-25 transition duration-1000 group-hover:opacity-40 group-hover:duration-200"></div>
          <div className="relative w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl">
            <video
              src="/compressed_demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-6xl border-t border-black/5 px-6 py-18"
        id="how-it-works"
      >
        <div className="grid gap-12 md:grid-cols-3">
          <div className="space-y-4">
            <Keyboard className="h-12 w-12" />
            <h3 className="text-xl font-bold">1. Press a Shortcut</h3>
            <p className="leading-relaxed opacity-60">
              Trigger the lens with a simple key combination while browsing any
              page.
            </p>
          </div>

          <div className="space-y-4">
            <Brain className="h-12 w-12" />
            <h3 className="text-xl font-bold">2. AI Scans Page</h3>
            <p className="leading-relaxed opacity-60">
              Our lightweight vision model instantly identifies all Chinese
              characters in view.
            </p>
          </div>

          <div className="space-y-4">
            <SquareMousePointer className="h-12 w-12" />
            <h3 className="text-xl font-bold">3. Text is Selectable</h3>
            <p className="leading-relaxed opacity-60">
              An overlay is drawn on the screen, allowing for selection and
              lookup.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-zhonglens-white py-24 text-center" id="use-cases">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-8 md:mb-16 text-4xl font-bold">
            Built for Real Reading
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-black/5 bg-white p-8">
              <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src="/manga.jpg"
                  alt="Image of a manga with the ZhongLens Chinese overlay."
                  fill
                  className="object-contain"
                />
              </div>
              <h4 className="mb-2 text-lg font-bold">Manhua &amp; Comics</h4>
              <p className="text-sm leading-relaxed opacity-60">
                Look up vertical or stylized text in raw scans without manual
                typing.
              </p>
            </div>

            <div className="rounded-3xl border border-black/5 bg-white p-8">
              <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src="/zaijian.jpg"
                  alt="Image of a TV show with the ZhongLens Chinese overlay."
                  fill
                  className="object-contain"
                />
              </div>
              <h4 className="mb-2 text-lg font-bold">Hard-coded Subtitles</h4>
              <p className="text-sm leading-relaxed opacity-60">
                Select text directly from video frames on YouTube, Bilibili, or
                Netflix.
              </p>
            </div>

            <div className="rounded-3xl border border-black/5 bg-white p-8">
              <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src="/textbook.jpg"
                  alt="Image of a Chinese textbook with the ZhongLens Chinese overlay."
                  fill
                  className="object-contain"
                />
              </div>
              <h4 className="mb-2 text-lg font-bold">PDFs &amp; Screenshots</h4>
              <p className="text-sm leading-relaxed opacity-60">
                Perfect for textbooks and system menus that block text
                interaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      <EmailForm />
    </div>
  );
}
