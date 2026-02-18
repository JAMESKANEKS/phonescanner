import { useEffect, useContext, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { CartContext } from "../context/CartContext";

export default function Scanner() {
  const { addToCart } = useContext(CartContext);
  const scanCooldownRef = useRef(false);

  // Beep sound for every added product
  const beep = useRef(
    new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
  );

  useEffect(() => {
    const scanner = new Html5Qrcode("reader");

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (barcode) => {
        if (scanCooldownRef.current) return; // Prevent overlapping scans

        scanCooldownRef.current = true; // Set cooldown

        try {
          // 🔎 Search product in Firestore
          const q = query(collection(db, "products"), where("barcode", "==", barcode));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            snapshot.forEach(async (docSnapshot) => {
              const productData = docSnapshot.data();
              const currentStock = productData.stock || 0;
              
              // 🔍 CHECK STOCK AVAILABILITY
              if (currentStock <= 0) {
                alert(`⚠️ Product "${productData.name}" is out of stock!`);
                return;
              }

              addToCart({ id: docSnapshot.id, ...productData });

              // ✅ Play beep every time a product is added
              beep.current.currentTime = 0; // reset for overlapping
              beep.current.play();
            });
          }
        } catch (err) {
          console.error("Scan error:", err);
        }

        // ⏱ Small delay to prevent ultra-rapid duplicates
        setTimeout(() => {
          scanCooldownRef.current = false;
        }, 800); // 500ms between scans
      }
    );

    return () => scanner.stop();
  }, []);

  return <div id="reader" style={{ width: "300px" }} />;
}
