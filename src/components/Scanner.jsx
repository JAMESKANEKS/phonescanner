import { useEffect, useContext, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CartContext } from "../context/CartContext";

export default function Scanner() {
  const { addToCart } = useContext(CartContext);
  const lastScanRef = useRef({ code: null, time: 0 });

  // beep sound
  const beep = new Audio(
    "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
  );

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (barcode) => {
        const now = Date.now();

        // ⏱ 2 seconds cooldown for same barcode
        if (barcode === lastScanRef.current.code && now - lastScanRef.current.time < 2000) {
          return; // ignore repeated scan
        }

        lastScanRef.current = { code: barcode, time: now };

        // 🔎 Search product in Firestore
        const q = query(collection(db, "products"), where("barcode", "==", barcode));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          snapshot.forEach((doc) => {
            addToCart({ id: doc.id, ...doc.data() });
          });

          // ✅ play beep
          beep.play();
        }
      }
    );

    return () => scanner.stop();
  }, []);

  return <div id="reader" style={{ width: "300px" }} />;
}
