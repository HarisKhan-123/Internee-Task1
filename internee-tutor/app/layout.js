import "./globals.css";

export const metadata = {
  title: "Internee.pk AI Tutor",
  description: "A personalized GenAI tutor for Internee.pk's learning modules",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
