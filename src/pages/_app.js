import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import { Provider } from 'react-redux';
import store from "@/store/store";
import Navbar from '../components/Navbar';


export default function App({ Component, pageProps }) {

  return (
    <Provider store={store}>
      <SessionProvider session={pageProps.session}>
        <Navbar />
        <Component {...pageProps} />
      </SessionProvider>
    </Provider>
  );
}
