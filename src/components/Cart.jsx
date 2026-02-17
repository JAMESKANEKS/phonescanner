import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function Cart() {
  const { cart, addToCart, decreaseQuantity, removeItem } =
    useContext(CartContext);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (cart.length === 0) return <p>No items in cart</p>;

  return (
    <div>
      <h2>Cart</h2>

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
    </div>
  );
}
