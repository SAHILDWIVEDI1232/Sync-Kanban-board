
import { LoaderCircle } from "lucide-react";

function Loading({ message = "Loading..." }) {
  return (
    <div style={styles.container}>
      <LoaderCircle size={28} style={{ animation: "spin 1s linear infinite" }} />
      <p>{message}</p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: 180,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: "#4f46e5"
  }
};

export default Loading;
