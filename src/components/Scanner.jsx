import { useEffect, useContext, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CartContext } from "../context/CartContext";

export default function Scanner({ active }) {
  const { addToCart } = useContext(CartContext);
  const scanCooldownRef = useRef(false);
  const scannerRef = useRef(null);

  // Beep sound for every added product
  const beep = useRef(
    new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
  );

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return; // Prevent multiple scanners

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        alert("No camera detected. Please connect a camera and try again.");
        return;
      }
    } catch (err) {
      console.error("Error checking cameras:", err);
      alert("Unable to access cameras. Please check browser permissions.");
      return;
    }

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (barcode) => {
          if (scanCooldownRef.current) return; // Prevent overlapping scans

          scanCooldownRef.current = true; // Set cooldown

          try {
            // 🔎 Search product in Firestore
            const q = query(
              collection(db, "products"),
              where("barcode", "==", barcode)
            );
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
            if (err.code === "permission-denied") {
              alert("Permission denied: You don't have access to camera or products.");
            } else if (err.code === "unavailable") {
              alert("Service unavailable: Please check your internet connection.");
            } else if (err.code === "not-found") {
              alert("Product not found. It may have been deleted.");
            } else {
              alert("Error scanning product: " + err.message);
            }
          }

          // ⏱ Small delay to prevent ultra-rapid duplicates
          setTimeout(() => {
            scanCooldownRef.current = false;
          }, 800); // 800ms between scans
        }
      )
      .catch((err) => {
        console.error("Scanner start error:", err);
        scannerRef.current = null;
      });
  }, [addToCart]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null;
        })
        .catch((err) => {
          console.error("Scanner stop error:", err);
        });
    }
  }, []);


  // React to `active` prop to start/stop
  useEffect(() => {
    if (active) {
      setTimeout(() => startScanner(), 0);
    } else {
      setTimeout(() => stopScanner(), 0);
    }

    return () => {
      // Cleanup on unmount
      setTimeout(() => stopScanner(), 0);
    };
  }, [active, startScanner, stopScanner]);

  return null;
}
