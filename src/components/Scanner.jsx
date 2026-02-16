import { useEffect, useContext } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CartContext } from "../context/CartContext";

export default function Scanner() {
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (barcode) => {
        const q = query(
          collection(db, "products"),
          where("barcode", "==", barcode)
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
          addToCart({ id: doc.id, ...doc.data() });
        });
      }
    );

    return () => scanner.stop();
  }, []);

  return <div id="reader" style={{ width: "300px" }} />;
}
