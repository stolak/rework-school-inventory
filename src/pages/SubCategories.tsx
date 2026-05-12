import { Navigate } from "react-router-dom";

/** Legacy route: sub-categories are managed on the Categories page. */
export default function SubCategories() {
  return <Navigate to="/categories" replace />;
}
