import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const socketInitializer = async () => {
      await fetch('/api/socket');
    };
    socketInitializer();
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
