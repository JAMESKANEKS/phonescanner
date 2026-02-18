import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Cart() {
  const { cart, setCart, addToCart, decreaseQuantity, removeItem } = useContext(CartContext);
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSoldNow = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
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

      const docRef = await addDoc(collection(db, "sales"), saleData);

      setCart([]);
      navigate(`/receipt/${docRef.id}`);
    } catch (err) {
      console.error("Error saving sale:", err);
      alert("Failed to save sale. Check console for error.");
    }
  };

  return (
    <div>
      <h1>Shopping Cart</h1>
      
      {cart.length === 0 ? (
        <p>No items in cart</p>
      ) : (
        <>
          {cart.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              <h4>{item.name}</h4>
              <p>Price: ₱{item.price}</p>

              {/* Quantity Controls */}
              <div>
                <button onClick={() => decreaseQuantity(item.id)}>−</button>

                <span style={{ margin: "0 10px" }}>
                  {item.quantity}
                </span>

                <button onClick={() => addToCart(item)}>+</button>

                {/* Optional remove button */}
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ marginLeft: "10px", color: "red" }}
                >
                  Remove
                </button>
              </div>

              <p>Subtotal: ₱{item.price * item.quantity}</p>
            </div>
          ))}

          <h3>Total: ₱{total}</h3>

          {/* Sold Now Button */}
          <button
            onClick={handleSoldNow}
            style={{ marginTop: "20px", padding: "10px 20px", fontSize: "16px" }}
          >
            Sold Now
          </button>
        </>
      )}
    </div>
  );
}
