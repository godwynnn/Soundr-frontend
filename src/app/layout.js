import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/MainLayout";
import ReduxProvider from "@/components/ReduxProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "soundr.",
  description: "The next wave of audio discovery.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.className} h-full antialiased`}
    >
      <body className="h-screen w-full flex bg-[#0e0f11] text-white overflow-hidden">
        <ReduxProvider>
          <MainLayout>{children}</MainLayout>
        </ReduxProvider>
      </body>
    </html>
  );
}
