import "./globals.css";

export const metadata = {
  title: "벨류업 가계부",
  description: "벨류업 가계부",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
