import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "flag-icons/css/flag-icons.min.css";
import "@/styles/globals.css";

export const metadata = {
  title: "ByteFX · IB Expense Manager",
  description: "Internal IB commissions, salaries and payout management.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
