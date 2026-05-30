import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { login } from "../Services/service";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthHook";
import { socket } from "../Socket/socket";

const COLORS = {
  BG_PAGE: "#0d0d0f",
  BG_CARD: "#13131a",
  BG_INNER: "#1e1e2e",
  BG_ELEMENT: "#252535",
  BORDER_CARD: "#2a2a38",
  BORDER_INNER: "#2e2e45",
  ACCENT_PRIMARY: "#6366f1",
  ACCENT_MID: "#8b5cf6",
  ACCENT_BRIGHT: "#a855f7",
  ACCENT_SOFT: "#a78bfa",
  ACCENT_LIGHT: "#c4b5fd",
  TEXT_PRIMARY: "#e8e4dc",
  TEXT_SECONDARY: "#b0aac4",
  TEXT_MUTED: "#7b7592",
  TEXT_LABEL: "#6b6880",
  TEXT_FAINT: "#4e4a60",
};

// Floating orb component
const Orb = ({ style, animate }) => (
  <motion.div
    style={{
      position: "absolute",
      borderRadius: "50%",
      filter: "blur(80px)",
      pointerEvents: "none",
      ...style,
    }}
    animate={animate}
    transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
  />
);

// Animated grid lines
const GridLines = () => (
  <svg
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#a78bfa" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

const PARTICLE_DATA = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 93,
  size: (i % 3) + 1,
  delay: (i * 0.4) % 4,
  duration: 4 + (i % 5),
}));

// Particle dots
const Particles = () => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
    {PARTICLE_DATA.map((dot) => (
      <motion.div
        key={dot.id}
        style={{
          position: "absolute",
          left: `${dot.x}%`,
          top: `${dot.y}%`,
          width: dot.size,
          height: dot.size,
          borderRadius: "50%",
          background: COLORS.ACCENT_SOFT,
          opacity: 0.4,
        }}
        animate={{ opacity: [0.1, 0.6, 0.1], y: [0, -12, 0] }}
        transition={{ duration: dot.duration, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
      />
    ))}
  </div>
);

// Input field component
const InputField = ({ label, type, value, onChange, icon, placeholder }) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{
        display: "block",
        fontSize: "11px",
        fontWeight: 500,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: focused ? COLORS.ACCENT_SOFT : COLORS.TEXT_LABEL,
        marginBottom: "8px",
        transition: "color 0.2s",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </label>
      <motion.div
        animate={{
          boxShadow: focused
            ? `0 0 0 1.5px ${COLORS.ACCENT_PRIMARY}, 0 0 20px rgba(99,102,241,0.15)`
            : `0 0 0 1px ${COLORS.BORDER_INNER}`,
        }}
        transition={{ duration: 0.2 }}
        style={{
          position: "relative",
          borderRadius: "12px",
          background: COLORS.BG_INNER,
          overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          color: focused ? COLORS.ACCENT_SOFT : COLORS.TEXT_FAINT,
          transition: "color 0.2s",
          display: "flex",
          alignItems: "center",
        }}>
          {icon}
        </div>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            padding: "14px 16px 14px 44px",
            fontSize: "14px",
            color: COLORS.TEXT_PRIMARY,
            fontFamily: "'DM Sans', sans-serif",
            paddingRight: isPassword ? "44px" : "16px",
          }}
        />
        {isPassword && (
          <button
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: COLORS.TEXT_FAINT,
              display: "flex",
              padding: 0,
            }}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default function ZyncLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();


  const handleLogin = async () => {
    if (!email || !password) return;
    if (email || password) {
      const res = await login({
        email,
        password
      })
      window.localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user)
  
      socket.connect();  //socket connection
      setTimeout(() => {
        navigate("/chats")
      }, 600)
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 2000);
  };

  // stagger variants
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
  };
  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: ${COLORS.TEXT_FAINT}; }
        body { background: ${COLORS.BG_PAGE}; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: COLORS.BG_PAGE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px",
      }}>

        {/* Background layer */}
        <GridLines />
        <Particles />

        {/* Ambient orbs */}
        <Orb
          style={{ width: 500, height: 500, top: "-15%", left: "-10%", background: "rgba(99,102,241,0.12)" }}
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        />
        <Orb
          style={{ width: 400, height: 400, bottom: "-10%", right: "-5%", background: "rgba(168,85,247,0.1)" }}
          animate={{ x: [0, -25, 0], y: [0, -20, 0] }}
        />
        <Orb
          style={{ width: 250, height: 250, top: "40%", right: "15%", background: "rgba(139,92,246,0.08)" }}
          animate={{ x: [0, 15, 0], y: [0, 25, 0] }}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%",
            maxWidth: "420px",
            background: COLORS.BG_CARD,
            border: `1px solid ${COLORS.BORDER_CARD}`,
            borderRadius: "24px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(163,131,255,0.05)",
          }}
        >
          {/* Top shimmer line */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)",
              zIndex: 10,
            }}
          />

          {/* Header */}
          <div style={{
            padding: "40px 40px 32px",
            background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* header glow */}
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(circle at 25% 60%, rgba(99,102,241,0.2) 0%, transparent 60%), radial-gradient(circle at 75% 20%, rgba(168,85,247,0.14) 0%, transparent 50%)",
              pointerEvents: "none",
            }} />

            <motion.div variants={container} initial="hidden" animate="show">
              {/* Logo */}
              <motion.div variants={item} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 5 }}
                  style={{
                    width: "40px", height: "40px",
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    borderRadius: "12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </motion.div>
                <span style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "22px",
                  color: "#fff",
                  letterSpacing: "0.05em",
                  position: "relative",
                }}>
                  ZYNC
                </span>
              </motion.div>

              <motion.h1 variants={item} style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "30px",
                lineHeight: 1.15,
                color: "#fff",
                marginBottom: "8px",
                position: "relative",
              }}>
                Welcome<br />
                <em style={{ color: COLORS.ACCENT_SOFT, fontStyle: "italic" }}>back.</em>
              </motion.h1>

              <motion.p variants={item} style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.45)",
                fontWeight: 300,
                letterSpacing: "0.02em",
                position: "relative",
              }}>
                Sign in to continue your conversations
              </motion.p>
            </motion.div>
          </div>

          {/* Form body */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{ padding: "32px 40px 36px" }}
          >
            <motion.div variants={item}>
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
                  </svg>
                }
              />
            </motion.div>

            <motion.div variants={item}>
              <InputField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                }
              />
            </motion.div>

            {/* Forgot password */}
            <motion.div variants={item} style={{ textAlign: "right", marginTop: "-10px", marginBottom: "24px" }}>
              <motion.a
                href="#"
                whileHover={{ color: COLORS.ACCENT_LIGHT }}
                style={{ fontSize: "12px", color: COLORS.TEXT_FAINT, textDecoration: "none", transition: "color 0.2s" }}
              >
                Forgot password?
              </motion.a>
            </motion.div>

            {/* Login button */}
            <motion.div variants={item}>
              <motion.button
                onClick={handleLogin}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(99,102,241,0.45)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: done
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  border: "none",
                  borderRadius: "50px",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.4s",
                  boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                }}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        style={{
                          width: 16, height: 16,
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                        }}
                      />
                      Signing in...
                    </motion.div>
                  ) : done ? (
                    <motion.div
                      key="done"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      You're in!
                    </motion.div>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      Login to ZYNC →
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>

            {/* Divider */}
            <motion.div variants={item} style={{
              display: "flex", alignItems: "center", gap: "12px",
              margin: "24px 0",
            }}>
              <div style={{ flex: 1, height: "1px", background: COLORS.BORDER_INNER }} />
              <span style={{ fontSize: "11px", color: COLORS.TEXT_FAINT, letterSpacing: "0.08em" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: COLORS.BORDER_INNER }} />
            </motion.div>

            {/* Sign up link */}
            <motion.p variants={item} style={{
              textAlign: "center", fontSize: "13px",
              color: COLORS.TEXT_MUTED,
            }}>
              New to ZYNC?{" "}
              <motion.a
                href="/register"
                whileHover={{ color: COLORS.ACCENT_LIGHT }}
                style={{
                  color: COLORS.ACCENT_SOFT,
                  textDecoration: "none",
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
              >
                Create an account
              </motion.a>
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}