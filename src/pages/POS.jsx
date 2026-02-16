import { useContext } from "react";
import Scanner from "../components/Scanner";
import Cart from "../components/Cart";
import { CartContext } from "../context/CartContext";
import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function POS() {
  const { cart, setCart } = useContext(CartContext);
  const navigate = useNavigate();

  const handleSoldNow = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

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

    // Save to Firestore
    const docRef = await addDoc(collection(db, "sales"), saleData);

    // Clear cart
    setCart([]);

    // Navigate to receipt page
    navigate(`/receipt/${docRef.id}`);
  };

  return (
    <div>
      <h1>POS System</h1>
      <Scanner />
      <Cart />

      <button onClick={handleSoldNow} style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px" }}>
        Sold Now
      </button>
    </div>
  );
}
