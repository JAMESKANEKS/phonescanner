import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function Cart() {
  const { cart } = useContext(CartContext);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div>
      <h2>Cart</h2>

      {cart.map((item, i) => (
        <p key={i}>
          {item.name} — ₱{item.price}
        </p>
      ))}

      <h3>Total: ₱{total}</h3>
    </div>
  );
}
