import { useEffect, useContext, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CartContext } from "../context/CartContext";

export default function Scanner({ active, scannerId = "reader", onScan }) {
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
      // Ensure any existing scanner instances are cleaned up first
      await Html5Qrcode.getCameras();
      
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        alert("No camera detected. Please connect a camera and try again.");
        return;
      }
    } catch (err) {
      console.error("Error checking cameras:", err);
      // Try to clear any existing scanner instances
      try {
        if (scannerRef.current) {
          await scannerRef.current.stop();
          scannerRef.current = null;
        }
      } catch (cleanupErr) {
        console.log("Cleanup attempt:", cleanupErr);
      }
      
      // Retry camera access after cleanup
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          alert("No camera detected. Please connect a camera and try again.");
          return;
        }
      } catch (retryErr) {
        console.error("Retry failed:", retryErr);
        alert("Unable to access cameras. Please check browser permissions and refresh the page.");
        return;
      }
    }

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (barcode) => {
          if (scanCooldownRef.current) return; // Prevent overlapping scans

          scanCooldownRef.current = true; // Set cooldown

          // If custom onScan handler is provided, use it
          if (onScan) {
            onScan(barcode);
          } else {
            // Default behavior: add to cart
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
  }, [addToCart, onScan, scannerId]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null;
        })
        .catch((err) => {
          console.error("Scanner stop error:", err);
          // Force cleanup even if there's an error
          try {
            scannerRef.current.clear();
          } catch (clearErr) {
            console.log("Clear error:", clearErr);
          }
          scannerRef.current = null;
        });
    }
  }, []);


  // React to `active` prop to start/stop
  useEffect(() => {
    if (active) {
      // Add a small delay to ensure previous scanner is fully cleaned up
      setTimeout(() => startScanner(), 300);
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
