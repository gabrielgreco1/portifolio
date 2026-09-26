import Home from "../page";

const title = "Gabriel Greco — Data Engineer";
const description =
  "I'm not a designer. I'm the data guy. Large-scale crawling, data platforms, regulatory indices, and automation systems.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/data-engineer",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title,
    description,
    url: "https://gabrielgreco.com/data-engineer",
    siteName: "Gabriel Greco",
    images: [
      {
        url: "/og-gabriel-card-v3.jpg",
        width: 1200,
        height: 630,
        alt: "Gabriel Greco — Data Engineer. I'm not a designer. I'm the data guy.",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-gabriel-card-v3.jpg"],
  },
};

export default Home;
