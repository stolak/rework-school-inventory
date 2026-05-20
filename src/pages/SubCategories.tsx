import { Navigate } from "react-router-dom";

/** Legacy route: sub-categories are managed on the Inventory page. */
export default function SubCategories() {
  return <Navigate to="/inventory?tab=setup" replace />;
}
