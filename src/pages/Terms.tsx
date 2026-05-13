import { Navigate } from "react-router-dom";

/** Legacy route: terms are managed on the Sessions page. */
export default function Terms() {
  return <Navigate to="/sessions" replace />;
}
