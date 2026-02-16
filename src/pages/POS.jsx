import { useContext } from "react";
import Scanner from "../components/Scanner";
import Cart from "../components/Cart";
import { CartContext } from "../context/CartContext";
import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function POS() {
  const { cart, setCart } = useContext(CartContext); // <-- ensure setCart exists
  const navigate = useNavigate();

  const handleSoldNow = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const saleData = {
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total,
        date: serverTimestamp(),
      };

      // Save sale to Firestore
      const docRef = await addDoc(collection(db, "sales"), saleData);

      // Clear cart
      setCart([]); // <-- works now because setCart is exposed

      // Navigate to receipt page
      navigate(`/receipt/${docRef.id}`);
    } catch (err) {
      console.error("Error saving sale:", err);
      alert("Failed to save sale. Check console for error.");
    }
  };

  return (
    <div>
      <h1>POS System</h1>
      <Scanner />
      <Cart />
      <button
        onClick={handleSoldNow}
        style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px" }}
      >
        Sold Now
      </button>
    </div>
  );
}
