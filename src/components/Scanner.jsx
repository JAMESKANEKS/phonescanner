import { useEffect, useContext, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CartContext } from "../context/CartContext";

export default function Scanner({ active, scannerId = "reader", onScan, onScanSuccess }) {
  const { addToCart } = useContext(CartContext);
  const scanCooldownRef = useRef(false);
  const scannerRef = useRef(null);
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);

  // Beep sound for every added product
  const beep = useRef(
    new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
  );

  const startScanner = useCallback(async () => {
    // Prevent multiple scanners or if already starting/stopping
    if (scannerRef.current || isStartingRef.current || isStoppingRef.current) return;
    
    isStartingRef.current = true;

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        alert("No camera detected. Please connect a camera and try again.");
        isStartingRef.current = false;
        return;
      }
    } catch (err) {
      console.error("Error checking cameras:", err);
      // If camera is in use or permission error, wait a bit and retry once
      if (err.message?.includes("in use") || err.message?.includes("Permission") || err.message?.includes("NotAllowedError")) {
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras || cameras.length === 0) {
            alert("No camera detected. Please connect a camera and try again.");
            isStartingRef.current = false;
            return;
          }
        } catch (retryErr) {
          alert("Unable to access cameras. Please check browser permissions and ensure no other app is using the camera.");
          isStartingRef.current = false;
          return;
        }
      } else {
        alert("Unable to access cameras. Please check browser permissions.");
        isStartingRef.current = false;
        return;
      }
    }

    try {
      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: 250,
          aspectRatio: 1.0,
          disableFlip: false
        },
        async (barcode) => {
          if (scanCooldownRef.current) return; // Prevent overlapping scans

          scanCooldownRef.current = true; // Set cooldown

          // Use onScanSuccess if provided (for POS component), otherwise onScan, otherwise default behavior
          const scanHandler = onScanSuccess || onScan;
          
          if (scanHandler) {
            try {
              await scanHandler(barcode);
              // Play beep on successful scan
              beep.current.currentTime = 0;
              beep.current.play().catch(() => {});
            } catch (err) {
              console.error("Scan handler error:", err);
            }
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
        },
        (errorMessage) => {
          // Ignore scanning errors - scanner continues running
          // Only log if it's not a common "not found" error
          if (!errorMessage.includes("NotFoundException")) {
            console.debug("Scanning...", errorMessage);
          }
        }
      );
      
      isStartingRef.current = false;
    } catch (err) {
      console.error("Scanner start error:", err);
      scannerRef.current = null;
      isStartingRef.current = false;
      
      // Don't show alert if scanner is being stopped intentionally
      if (active) {
        alert("Failed to start scanner: " + err.message);
      }
    }
  }, [addToCart, onScan, onScanSuccess, scannerId, active]);

  const stopScanner = useCallback(async () => {
    // Prevent multiple stop calls
    if (isStoppingRef.current) return;
    
    if (scannerRef.current) {
      isStoppingRef.current = true;
      const scanner = scannerRef.current;
      scannerRef.current = null; // Clear ref immediately to prevent race conditions
      
      try {
        // Stop the scanner and clear the camera stream
        await scanner.stop();
      } catch (err) {
        // Ignore errors if scanner is already stopped
        if (!err.message?.includes("already") && !err.message?.includes("NotStartedError")) {
          console.debug("Scanner stop error (may already be stopped):", err.message);
        }
      }
      
      try {
        // Always clear to release camera resources
        await scanner.clear();
      } catch (err) {
        // Ignore clear errors
        console.debug("Scanner clear error (may already be cleared):", err.message);
      }
      
      // Small delay to ensure camera is fully released before allowing new scanner
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Reset flags
      isStartingRef.current = false;
      isStoppingRef.current = false;
    } else {
      // Ensure flags are reset even if no scanner instance
      isStartingRef.current = false;
      isStoppingRef.current = false;
    }
  }, []);


  // React to `active` prop to start/stop
  useEffect(() => {
    let timer = null;
    let isMounted = true;
    
    if (active) {
      // Small delay to ensure DOM is ready
      timer = setTimeout(() => {
        if (isMounted) {
          startScanner();
        }
      }, 100);
    } else {
      stopScanner();
    }
    
    // Cleanup function - runs when component unmounts or dependencies change
    return () => {
      isMounted = false;
      if (timer) {
        clearTimeout(timer);
      }
      // Always stop scanner on unmount to release camera
      stopScanner();
    };
  }, [active, startScanner, stopScanner]);

  return null;
}
