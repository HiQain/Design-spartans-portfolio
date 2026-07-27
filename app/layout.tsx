import type { Metadata } from "next";
import { Acme, Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";

const acme = Acme({
  variable: "--font-acme",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const SITE_URL = "https://designspartansllc.web.app";
const SITE_TITLE = "Design Spartans | Web Design, Logo Design and Digital Marketing";
const SITE_DESCRIPTION =
  "Design Spartans is a digital agency that provides logo design, web design & development, digital marketing and other digital services to boost businesses.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    images: [{ url: "/meta-banner.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/meta-banner.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${acme.variable} ${roboto.variable} ${robotoCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
