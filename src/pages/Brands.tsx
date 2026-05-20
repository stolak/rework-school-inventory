import { Navigate } from "react-router-dom";

/** Legacy route: brands are managed on Inventory basic setup. */
export default function Brands() {
  return <Navigate to="/categories" replace />;
}
