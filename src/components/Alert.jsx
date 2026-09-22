export default function Alert({ type = "error", children }) {
  if (!children) return null;
  return (
    <div className={type === "success" ? "success-box" : "error-box"} role={type === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
