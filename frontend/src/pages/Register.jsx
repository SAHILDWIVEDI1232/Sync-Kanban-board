
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Mail,
  Lock
} from "lucide-react";

import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", formData);

      if (response.data.success) {
        setMessage(
          response.data.message || "Registration successful!"
        );

        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        setError(response.data.message || "Registration failed");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Unable to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <LayoutDashboard size={30} />
        </div>

        <h1 style={styles.title}>Create Account</h1>

        <p style={styles.subtitle}>
          Join SyncBoard and start collaborating
        </p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Full Name</label>

          <div style={styles.inputBox}>
            <User size={19} color="#64748b" />

            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <label style={styles.label}>Email Address</label>

          <div style={styles.inputBox}>
            <Mail size={19} color="#64748b" />

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <label style={styles.label}>Password</label>

          <div style={styles.inputBox}>
            <Lock size={19} color="#64748b" />

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
              style={styles.input}
            />
          </div>

          {error && (
            <p style={styles.error}>{error}</p>
          )}

          {message && (
            <p style={styles.success}>{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background: "#f1f5f9"
  },
  card: {
    width: "100%",
    maxWidth: "430px",
    background: "#ffffff",
    padding: "38px",
    borderRadius: "16px",
    boxShadow: "0 10px 35px rgba(15,23,42,0.08)"
  },
  logo: {
    width: "55px",
    height: "55px",
    borderRadius: "14px",
    background: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "24px"
  },
  title: {
    fontSize: "25px",
    fontWeight: "800",
    marginBottom: "10px",
    color: "#0f172a"
  },
  subtitle: {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "28px"
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
    marginTop: "18px"
  },
  inputBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    padding: "0 12px"
  },
  input: {
    width: "100%",
    padding: "13px 0",
    border: "none",
    outline: "none",
    fontSize: "14px"
  },
  button: {
    width: "100%",
    marginTop: "25px",
    padding: "14px",
    border: "none",
    borderRadius: "9px",
    background: "#4f46e5",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "15px"
  },
  error: {
    color: "#dc2626",
    fontSize: "13px",
    marginTop: "12px"
  },
  success: {
    color: "#16a34a",
    fontSize: "13px",
    marginTop: "12px"
  },
  footer: {
    textAlign: "center",
    marginTop: "25px",
    fontSize: "14px",
    color: "#64748b"
  },
  link: {
    color: "#4f46e5",
    fontWeight: "700"
  }
};

export default Register;
