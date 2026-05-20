import { Navigate } from "react-router-dom";

/** Legacy route: units are managed on Inventory basic setup. */
export default function Uoms() {
  return <Navigate to="/categories" replace />;
}
