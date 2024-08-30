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

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Initialize the socket server
    axios.get('/api/initSocket');
  }, []);

  return (
    <Provider store={store}>
      <SessionProvider session={pageProps.session}>
        <Navbar />
        <Component {...pageProps} />
        <Modal />
      </SessionProvider>
    </Provider>
  );
}