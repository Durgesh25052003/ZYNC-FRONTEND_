import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { register } from "../Services/service";


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

// ── Background pieces ─────────────────────────────────────────────────────────

const Orb = ({ style, animate }) => (
    <motion.div
        style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", ...style }}
        animate={animate}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
    />
);

const GridLines = () => (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern id="grid2" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#a78bfa" strokeWidth="0.5" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid2)" />
    </svg>
);

const PARTICLE_DATA = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: (i * 41 + 13) % 97,
    y: (i * 59 + 9) % 93,
    size: (i % 3) + 1,
    delay: (i * 0.35) % 4,
    duration: 4 + (i % 5),
}));

const Particles = () => (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {PARTICLE_DATA.map((dot) => (
            <motion.div
                key={dot.id}
                style={{ position: "absolute", left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size, borderRadius: "50%", background: COLORS.ACCENT_SOFT, opacity: 0.4 }}
                animate={{ opacity: [0.1, 0.6, 0.1], y: [0, -12, 0] }}
                transition={{ duration: dot.duration, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
            />
        ))}
    </div>
);

// ── Reusable Input ────────────────────────────────────────────────────────────

const InputField = ({ label, type = "text", value, onChange, icon, placeholder, error }) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div style={{ marginBottom: "16px" }}>
            <label style={{
                display: "block", fontSize: "10px", fontWeight: 500,
                letterSpacing: "0.1em", textTransform: "uppercase",
                color: error ? "#f87171" : focused ? COLORS.ACCENT_SOFT : COLORS.TEXT_LABEL,
                marginBottom: "7px", transition: "color 0.2s", fontFamily: "'DM Sans', sans-serif",
            }}>
                {label}
            </label>
            <motion.div
                animate={{
                    boxShadow: error
                        ? "0 0 0 1.5px #f87171, 0 0 16px rgba(248,113,113,0.1)"
                        : focused
                            ? `0 0 0 1.5px ${COLORS.ACCENT_PRIMARY}, 0 0 20px rgba(99,102,241,0.15)`
                            : `0 0 0 1px ${COLORS.BORDER_INNER}`,
                }}
                transition={{ duration: 0.2 }}
                style={{ position: "relative", borderRadius: "12px", background: COLORS.BG_INNER }}
            >
                <div style={{
                    position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                    color: error ? "#f87171" : focused ? COLORS.ACCENT_SOFT : COLORS.TEXT_FAINT,
                    transition: "color 0.2s", display: "flex", alignItems: "center",
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
                        width: "100%", background: "transparent", border: "none", outline: "none",
                        padding: "13px 14px 13px 42px", fontSize: "13.5px",
                        color: COLORS.TEXT_PRIMARY, fontFamily: "'DM Sans', sans-serif",
                        paddingRight: isPassword ? "42px" : "14px",
                    }}
                />
                {isPassword && (
                    <button
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.TEXT_FAINT, display: "flex", padding: 0 }}
                    >
                        {showPassword ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                )}
            </motion.div>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        style={{ fontSize: "11px", color: "#f87171", marginTop: "5px", fontFamily: "'DM Sans', sans-serif" }}
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Password strength meter ───────────────────────────────────────────────────

const PasswordStrength = ({ password }) => {
    const score = [/.{6,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    const colors = ["", "#ef4444", "#f59e0b", "#6366f1", "#22c55e"];

    if (!password) return null;

    return (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: "-8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                {[1, 2, 3, 4].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ background: i <= score ? colors[score] : COLORS.BG_ELEMENT }}
                        transition={{ duration: 0.3 }}
                        style={{ flex: 1, height: "3px", borderRadius: "2px" }}
                    />
                ))}
            </div>
            <p style={{ fontSize: "10px", color: colors[score], letterSpacing: "0.05em", fontFamily: "'DM Sans', sans-serif" }}>
                {labels[score]}
            </p>
        </motion.div>
    );
};

// ── Avatar picker ─────────────────────────────────────────────────────────────

const AvatarPicker = ({ preview, onPick }) => {
    const [hover, setHover] = useState(false);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        onPick(file);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
            <motion.label
                htmlFor="avatar-upload"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{
                    width: "80px", height: "80px", borderRadius: "50%", cursor: "pointer",
                    position: "relative", overflow: "hidden",
                    boxShadow: hover ? `0 0 0 2px ${COLORS.ACCENT_PRIMARY}, 0 0 20px rgba(99,102,241,0.3)` : `0 0 0 2px ${COLORS.BORDER_INNER}`,
                    transition: "box-shadow 0.25s",
                }}
            >
                <img
                    src={preview || "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-High-Quality-Image.png"}
                    alt="avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <motion.div
                    animate={{ opacity: hover ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: "absolute", inset: 0, background: "rgba(99,102,241,0.7)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </motion.div>
            </motion.label>
            <input id="avatar-upload" type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            <p style={{ fontSize: "11px", color: COLORS.TEXT_FAINT, marginTop: "8px", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em" }}>
                Click to upload avatar
            </p>
        </div>
    );
};

// ── Main Register Component ───────────────────────────────────────────────────

export default function ZyncRegister() {
    const [form, setForm] = useState({ username: "", email: "", phoneNo: "", password: "", confirmPassword: "" });
    const [avatarUrl, setavatarUrl] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

    const validate = () => {
        const e = {};
        if (!form.username.trim()) e.username = "Username is required";
        if (!/^\w+([\.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(form.email)) e.email = "Enter a valid email address";
        if (!/^\d{10}$/.test(form.phoneNo)) e.phoneNo = "Enter a valid 10-digit phone number";
        if (form.password.length < 6) e.password = "Password must be at least 6 characters";
        if (form.confirmPassword.length < 6) e.confirmPassword = "Must be at least 6 characters";
        if (form.password && form.confirmPassword && form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
        return e;
    };

    const handleSubmit = async () => {
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setLoading(true);

        const formData = new FormData();
        formData.append('username', form.username);
        formData.append('email', form.email);
        formData.append('phoneNo', form.phoneNo);
        formData.append('password', form.password);
        formData.append('confirmPassword', form.confirmPassword);
        if (avatarUrl) {
            formData.append('avatarUrl', avatarUrl);
        }

        try {
            const res = await register(formData);
            console.log(res);
            setDone(true);
        } catch (error) {
            console.error("Registration failed:", error);
            // Optionally, you can set an error state here to show a message to the user
        } finally {
            setLoading(false);
        }
    };

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: ${COLORS.TEXT_FAINT}; }
        body { background: ${COLORS.BG_PAGE}; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.BG_ELEMENT}; border-radius: 4px; }
      `}</style>

            <div style={{
                minHeight: "100vh", background: COLORS.BG_PAGE,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
                fontFamily: "'DM Sans', sans-serif", padding: "24px",
            }}>
                <GridLines />
                <Particles />

                <Orb style={{ width: 500, height: 500, top: "-15%", left: "-10%", background: "rgba(99,102,241,0.12)" }} animate={{ x: [0, 30, 0], y: [0, 20, 0] }} />
                <Orb style={{ width: 400, height: 400, bottom: "-10%", right: "-5%", background: "rgba(168,85,247,0.1)" }} animate={{ x: [0, -25, 0], y: [0, -20, 0] }} />
                <Orb style={{ width: 220, height: 220, top: "35%", right: "12%", background: "rgba(139,92,246,0.08)" }} animate={{ x: [0, 15, 0], y: [0, 25, 0] }} />

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        width: "100%", maxWidth: "440px",
                        background: COLORS.BG_CARD,
                        border: `1px solid ${COLORS.BORDER_CARD}`,
                        borderRadius: "24px", overflow: "hidden",
                        position: "relative",
                        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(163,131,255,0.05)",
                        maxHeight: "92vh", overflowY: "auto",
                    }}
                >
                    {/* shimmer */}
                    <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                        style={{ position: "sticky", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)", zIndex: 10 }}
                    />

                    {/* Header */}
                    <div style={{
                        padding: "36px 40px 28px",
                        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                        position: "relative", overflow: "hidden",
                    }}>
                        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 25% 60%, rgba(99,102,241,0.2) 0%, transparent 60%), radial-gradient(circle at 75% 20%, rgba(168,85,247,0.14) 0%, transparent 50%)", pointerEvents: "none" }} />

                        <motion.div variants={container} initial="hidden" animate="show">
                            <motion.div variants={item} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                                <motion.div
                                    whileHover={{ scale: 1.08, rotate: 5 }}
                                    style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #6366f1, #a855f7)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                        <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                                    </svg>
                                </motion.div>
                                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "22px", color: "#fff", letterSpacing: "0.05em" }}>ZYNC</span>
                            </motion.div>

                            <motion.h1 variants={item} style={{ fontFamily: "'DM Serif Display', serif", fontSize: "28px", lineHeight: 1.15, color: "#fff", marginBottom: "8px", position: "relative" }}>
                                Create your<br /><em style={{ color: COLORS.ACCENT_SOFT, fontStyle: "italic" }}>account.</em>
                            </motion.h1>
                            <motion.p variants={item} style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", fontWeight: 300, letterSpacing: "0.02em", position: "relative" }}>
                                Join ZYNC and start chatting instantly
                            </motion.p>
                        </motion.div>
                    </div>

                    {/* Form */}
                    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: "28px 40px 36px" }}>

                        {/* Avatar */}
                        <motion.div variants={item}>
                            <AvatarPicker preview={avatarUrl ? URL.createObjectURL(avatarUrl) : null} onPick={setavatarUrl} />
                        </motion.div>

                        {/* Username */}
                        <motion.div variants={item}>
                            <InputField label="Username" value={form.username} onChange={set("username")} placeholder="yourname" error={errors.username}
                                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                            />
                        </motion.div>

                        {/* Email */}
                        <motion.div variants={item}>
                            <InputField label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" error={errors.email}
                                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" /></svg>}
                            />
                        </motion.div>

                        {/* Phone */}
                        <motion.div variants={item}>
                            <InputField label="Phone Number" type="tel" value={form.phoneNo} onChange={set("phoneNo")} placeholder="10-digit number" error={errors.phoneNo}
                                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>}
                            />
                        </motion.div>

                        {/* Password */}
                        <motion.div variants={item}>
                            <InputField label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 characters" error={errors.password}
                                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
                            />
                            <PasswordStrength password={form.password} />
                        </motion.div>

                        {/* Confirm Password */}
                        <motion.div variants={item}>
                            <InputField label="Confirm Password" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat your password" error={errors.confirmPassword}
                                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
                            />
                        </motion.div>

                        {/* Submit */}
                        <motion.div variants={item} style={{ marginTop: "8px" }}>
                            <motion.button
                                onClick={handleSubmit}
                                whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(99,102,241,0.45)" }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    width: "100%", padding: "14px",
                                    background: done ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                                    border: "none", borderRadius: "50px", color: "#fff",
                                    fontSize: "14px", fontWeight: 500, letterSpacing: "0.06em",
                                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                    transition: "background 0.4s",
                                    boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                                style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }}
                                            />
                                            Creating account...
                                        </motion.div>
                                    ) : done ? (
                                        <motion.div key="done" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            Welcome to ZYNC!
                                        </motion.div>
                                    ) : (
                                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            Create Account →
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </motion.div>

                        {/* Divider + login link */}
                        <motion.div variants={item} style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
                            <div style={{ flex: 1, height: "1px", background: COLORS.BORDER_INNER }} />
                            <span style={{ fontSize: "11px", color: COLORS.TEXT_FAINT, letterSpacing: "0.08em" }}>OR</span>
                            <div style={{ flex: 1, height: "1px", background: COLORS.BORDER_INNER }} />
                        </motion.div>

                        <motion.p variants={item} style={{ textAlign: "center", fontSize: "13px", color: COLORS.TEXT_MUTED }}>
                            Already on ZYNC?{" "}
                            <motion.a href="/" whileHover={{ color: COLORS.ACCENT_LIGHT }}
                                style={{ color: COLORS.ACCENT_SOFT, textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
                            >
                                Sign in
                            </motion.a>
                        </motion.p>
                    </motion.div>
                </motion.div>
            </div>
        </>
    );
}