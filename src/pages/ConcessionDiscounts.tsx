import { Navigate } from "react-router-dom";

/** Legacy route: concession discounts live on the Billing & discounts page. */
export default function ConcessionDiscounts() {
  return <Navigate to="/billing-items" replace />;
}
