// src/pages/_app.js
import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";
import { Provider } from 'react-redux';
import { useEffect } from "react";
import store from "@/store/store";
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import axios from "axios";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useSession } from 'next-auth/react';

function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <SessionProvider session={pageProps.session}>
        <Layout>
          <Component {...pageProps} />
          <Modal />
        </Layout>
      </SessionProvider>
    </Provider>
  );
}

function Layout({ children }) {
  const { status } = useSession();

  return (
    <>
      {status === "authenticated" && <Navbar />}
      {children}
    </>
  );
}

export default MyApp;