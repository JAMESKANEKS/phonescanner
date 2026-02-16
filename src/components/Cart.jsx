import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function Cart() {
  const { cart } = useContext(CartContext);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      <h2>Cart</h2>
      {cart.length === 0 && <p>No items in cart</p>}

      {cart.map((item) => (
        <p key={item.id}>
          {item.name} — ₱{item.price} x {item.quantity} = ₱{item.price * item.quantity}
        </p>
      ))}

      <h3>Total: ₱{total}</h3>
    </div>
  );
}
