import { useEffect, useContext, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { CartContext } from "../context/CartContext";

// Global state to track if any scanner is stopping/stopped (shared across all Scanner instances)
let globalScannerStopping = false;
let globalScannerStopTime = 0;

// Helper function to stop all video tracks globally
const stopAllVideoTracks = () => {
  try {
    // Stop all video tracks from all video elements
    if (typeof document !== 'undefined') {
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        try {
          if (video && video.srcObject) {
            const stream = video.srcObject;
            if (stream instanceof MediaStream) {
              stream.getTracks().forEach(track => {
                try {
                  track.stop();
                } catch (trackErr) {
                  console.debug("Error stopping track:", trackErr);
                }
              });
            }
            video.srcObject = null;
          }
        } catch (videoErr) {
          console.debug("Error cleaning video element:", videoErr);
        }
      });
    }
  } catch (err) {
    const errMessage = err?.message || "Unknown error";
    console.debug("Error stopping all video tracks:", errMessage);
  }
};

export default function Scanner({ active, scannerId = "reader", onScan, onScanSuccess }) {
  const { addToCart } = useContext(CartContext);
  const scanCooldownRef = useRef(false);
  const scannerRef = useRef(null);
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);

  // Refs for callbacks so startScanner doesn't change when parent re-renders (keeps camera running)
  const onScanRef = useRef(onScan);
  const onScanSuccessRef = useRef(onScanSuccess);
  const addToCartRef = useRef(addToCart);

  // Update refs when props change
  useEffect(() => {
    onScanRef.current = onScan;
    onScanSuccessRef.current = onScanSuccess;
    addToCartRef.current = addToCart;
  }, [onScan, onScanSuccess, addToCart]);

  // Beep sound for every added product
  const beep = useRef(null);
  
  // Initialize beep audio
  useEffect(() => {
    try {
      beep.current = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      beep.current.preload = "auto";
    } catch (err) {
      console.debug("Failed to initialize beep audio:", err);
    }
  }, []);

  const startScanner = useCallback(async () => {
    // Prevent multiple scanners or if already starting/stopping
    if (scannerRef.current || isStartingRef.current || isStoppingRef.current) return;
    
    // Wait if another scanner instance is stopping globally
    if (globalScannerStopping) {
      const timeSinceStop = Date.now() - globalScannerStopTime;
      if (timeSinceStop < 800) {
        // Wait until enough time has passed since last stop
        await new Promise(resolve => setTimeout(resolve, 800 - timeSinceStop));
      }
    }
    
    isStartingRef.current = true;

    // Wait a bit before starting to ensure previous scanner is fully stopped
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        alert("No camera detected. Please connect a camera and try again.");
        isStartingRef.current = false;
        return;
      }
    } catch (err) {
      console.error("Error checking cameras:", err);
      const errMessage = err?.message || "";
      const errName = err?.name || "";
      // If camera is in use or permission error, wait longer and retry silently first
      if (errMessage.includes("in use") || errMessage.includes("Permission") || errMessage.includes("NotAllowedError") || errName === "NotAllowedError") {
        // Wait longer and retry silently (don't show error on first attempt)
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (!cameras || cameras.length === 0) {
            alert("No camera detected. Please connect a camera and try again.");
            isStartingRef.current = false;
            return;
          }
        } catch (retryErr) {
          console.error("Camera retry failed:", retryErr);
          // One more retry after stopping all tracks
          stopAllVideoTracks();
          await new Promise(resolve => setTimeout(resolve, 800));
          try {
            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
              alert("No camera detected. Please connect a camera and try again.");
              isStartingRef.current = false;
              return;
            }
          } catch (finalErr) {
            console.error("Final camera access attempt failed:", finalErr);
            // Only show error after all retries have failed
            alert("Unable to access cameras. Please check browser permissions and ensure no other app is using the camera.");
            isStartingRef.current = false;
            return;
          }
        }
      } else {
        // For other errors, show alert immediately
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

          // Use latest handlers from refs (scanner keeps running, no restart on parent re-render)
          const scanHandler = onScanSuccessRef.current || onScanRef.current;
          
          if (scanHandler) {
            try {
              await scanHandler(barcode);
              // Play beep on successful scan
              if (beep.current) {
                try {
                  beep.current.currentTime = 0;
                  await beep.current.play();
                } catch (audioErr) {
                  // Ignore audio play errors
                  console.debug("Beep play error:", audioErr);
                }
              }
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
                // Use for...of instead of forEach to properly handle async operations
                for (const docSnapshot of snapshot.docs) {
                  const productData = docSnapshot.data();
                  const currentStock = productData.stock || 0;

                  // 🔍 CHECK STOCK AVAILABILITY
                  if (currentStock <= 0) {
                    alert(`⚠️ Product "${productData.name}" is out of stock!`);
                    continue;
                  }

                  addToCartRef.current({ id: docSnapshot.id, ...productData });

                  // ✅ Play beep every time a product is added
                  try {
                    beep.current.currentTime = 0; // reset for overlapping
                    await beep.current.play();
                  } catch (audioErr) {
                    // Ignore audio play errors (may fail in some browsers)
                    console.debug("Beep play error:", audioErr);
                  }
                }
              }
            } catch (err) {
              console.error("Scan error:", err);
              const errCode = err?.code || "";
              const errMessage = err?.message || "Unknown error";
              if (errCode === "permission-denied") {
                alert("Permission denied: You don't have access to camera or products.");
              } else if (errCode === "unavailable") {
                alert("Service unavailable: Please check your internet connection.");
              } else if (errCode === "not-found") {
                alert("Product not found. It may have been deleted.");
              } else {
                alert("Error scanning product: " + errMessage);
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
          const msg = errorMessage || "";
          if (msg && !msg.includes("NotFoundException")) {
            console.debug("Scanning...", msg);
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
        const errMessage = err?.message || "Unknown error";
        alert("Failed to start scanner: " + errMessage);
      }
    }
  }, [scannerId, active]);

  const stopScanner = useCallback(async () => {
    // Prevent multiple stop calls
    if (isStoppingRef.current && !scannerRef.current) return;
    
    // Set global stopping state
    globalScannerStopping = true;
    globalScannerStopTime = Date.now();
    
    if (scannerRef.current) {
      isStoppingRef.current = true;
      const scanner = scannerRef.current;
      scannerRef.current = null; // Clear ref immediately to prevent race conditions
      
      try {
        // Stop the scanner and clear the camera stream
        await scanner.stop();
      } catch (err) {
        // Ignore errors if scanner is already stopped
        const errMessage = err?.message || "";
        if (!errMessage.includes("already") && !errMessage.includes("NotStartedError") && !errMessage.includes("NotFoundException")) {
          console.debug("Scanner stop error (may already be stopped):", errMessage);
        }
      }
      
      try {
        // Always clear to release camera resources
        await scanner.clear();
      } catch (err) {
        // Ignore clear errors - scanner may already be cleared
        const errMessage = err?.message || "";
        console.debug("Scanner clear error (may already be cleared):", errMessage);
      }
      
      // Stop all video tracks globally (more thorough cleanup)
      stopAllVideoTracks();
      
      // Also try to stop tracks from this specific scanner element
      try {
        const videoElement = document.querySelector(`#${scannerId} video`);
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject;
          const tracks = stream.getTracks();
          tracks.forEach(track => {
            track.stop();
          });
          videoElement.srcObject = null;
        }
      } catch (err) {
        // Ignore errors - this is a fallback cleanup
        const errMessage = err?.message || "";
        console.debug("Direct track cleanup error:", errMessage);
      }
      
      // Longer delay to ensure camera is fully released before allowing new scanner
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reset flags
      isStartingRef.current = false;
      isStoppingRef.current = false;
    } else {
      // Ensure flags are reset even if no scanner instance
      isStartingRef.current = false;
      isStoppingRef.current = false;
    }
    
    // Clear global stopping state after delay
    setTimeout(() => {
      globalScannerStopping = false;
    }, 600);
  }, [scannerId]);


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

  // Stop camera when navigating away or closing page
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Stop scanner immediately when page is unloading
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        // Use non-blocking cleanup for beforeunload
        scanner.stop().catch(() => {}).finally(() => {
          try {
            scanner.clear().catch(() => {});
          } catch (clearErr) {
            // Ignore clear errors during unload
            console.debug("Clear error during unload:", clearErr);
          }
        });
        // Also stop all tracks immediately
        stopAllVideoTracks();
      }
    };

    const handleVisibilityChange = () => {
      // Stop scanner when page becomes hidden (user switches tabs, minimizes, etc.)
      if (document.hidden && scannerRef.current) {
        stopScanner();
      }
    };

    // Listen for page unload events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup listeners
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      // Ensure camera is stopped on unmount
      stopScanner();
    };
  }, [stopScanner]);

  return null;
}
