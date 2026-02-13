import { useState, useEffect } from "react";
import "~/assets/tailwind.css";

export default () => {
  const [count, setCount] = useState(1);
  const increment = () => setCount((count) => count + 1);

  return (
    <div>
      <p className="text-5xl">This is React. {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};
