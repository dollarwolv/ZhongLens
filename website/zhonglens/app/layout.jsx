import { Bitter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const bitter = Bitter({
  subsets: ["latin"],
});

export const metadata = {
  title: "ZhongLens - use pop-up dictionaries anywhere!",
  description:
    "ZhongLens is a chrome extension for learning Chinese that lets you use a popup dictionary anywhere.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          as="video"
          href="/compressed_demo.mp4"
          type="video/mp4"
        />
      </head>
      <body className={`${bitter.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
