import { Navigate } from "react-router-dom";

/** Legacy route: sub-classes are managed on the Classes page. */
export default function SubClasses() {
  return <Navigate to="/classes" replace />;
}
