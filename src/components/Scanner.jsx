import { useEffect, useContext, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { CartContext } from "../context/CartContext";

export default function Scanner() {
  const { addToCart } = useContext(CartContext);
  const scanCooldownRef = useRef(false);
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(true);

  // Beep sound for every added product
  const beep = useRef(
    new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
  );

  const startScanner = () => {
    if (scannerRef.current) return; // Prevent multiple scanners

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;
    setIsScanning(true);

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
          if (err.code === 'permission-denied') {
            alert("Permission denied: You don't have access to camera or products.");
          } else if (err.code === 'unavailable') {
            alert("Service unavailable: Please check your internet connection.");
          } else if (err.code === 'not-found') {
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
    ).catch((err) => {
      console.error("Scanner start error:", err);
      setIsScanning(false);
      scannerRef.current = null;
    });
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current = null;
        setIsScanning(false);
      }).catch((err) => {
        console.error("Scanner stop error:", err);
      });
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div>
      <div id="reader" style={{ width: "300px" }} />
      {!isScanning && (
        <button 
          onClick={startScanner} 
          style={{ marginTop: "10px", padding: "10px" }}
        >
          Restart Camera
        </button>
      )}
    </div>
  );
}
