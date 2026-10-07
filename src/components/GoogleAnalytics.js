import Script from "next/script";

export default function GoogleAnalytics() {
  return (
    <>
      <Script
        id="google-analytics-loader"
        src="https://www.googletagmanager.com/gtag/js?id=G-DJ7RMKV2HR"
        strategy="afterInteractive"
      />
      <Script id="google-analytics-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-DJ7RMKV2HR');
        `}
      </Script>
    </>
  );
}
