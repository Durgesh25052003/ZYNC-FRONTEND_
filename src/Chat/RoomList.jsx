import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createDMRoom, createRoom, searchUsers, updateProfile } from "../Services/service";
import { shapeRoom } from "../utils/ShapeRoom";
import useChatRes from "../Contexts/ChatContext.jsx/ChatHook";
import { useAuth } from "../Contexts/AuthHook";

// ── Motion variants ───────────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075, delayChildren: 0.22 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20, filter: "blur(3px)" },
  show: {
    opacity: 1, x: 0, filter: "blur(0px)",
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCENT_PALETTE = ["#6366f1", "#a855f7", "#06b6d4", "#f59e0b", "#22c55e", "#ec4899"];
const accentFor = (id) => ACCENT_PALETTE[id.charCodeAt(0) % ACCENT_PALETTE.length];
const initial = (name = "") => name.trim().charAt(0).toUpperCase();

// ── PulseDot ──────────────────────────────────────────────────────────────────

const PulseDot = ({ borderColor = "#13131a" }) => (
  <span style={{ position: "relative", display: "inline-flex", width: 11, height: 11 }}>
    <motion.span
      style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: "#34d399" }}
      animate={{ scale: [1, 2.2], opacity: [0.55, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
    />
    <span style={{
      position: "relative", display: "inline-flex",
      width: 11, height: 11, borderRadius: "50%",
      backgroundColor: "#34d399",
      border: `2.5px solid ${borderColor}`,
    }} />
  </span>
);

// ── SearchBar ─────────────────────────────────────────────────────────────────

const SearchBar = ({ value = "", onChange, onSubmit }) => {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleChange = (val) => {
    setQuery(val);
    if (onChange) onChange(val);
  };

  const handleClear = () => {
    setQuery("");
    if (onChange) onChange("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSubmit) {
      onSubmit(query.trim());
    }
  };

  return (
    <motion.div
      animate={{
        boxShadow: focused ? "0 0 0 1.5px #6366f1, 0 0 18px rgba(99,102,241,0.14)" : "0 0 0 1px #2a2a38",
        background: focused ? "#252535" : "#1a1a26",
      }}
      transition={{ duration: 0.2 }}
      style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 12, padding: "10px 14px" }}
    >
      <motion.div
        animate={{ color: focused ? "#a78bfa" : "#4e4a60" }}
        transition={{ duration: 0.2 }}
        style={{ display: "flex", flexShrink: 0 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </motion.div>
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        type="text"
        placeholder="Search rooms..."
        style={{ background: "transparent", border: "none", outline: "none", fontSize: 13, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif", width: "100%" }}
      />
      <AnimatePresence>
        {query && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={handleClear}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#4e4a60", display: "flex", padding: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── RoomAvatar ────────────────────────────────────────────────────────────────

const RoomAvatar = ({ room, isActive }) => {
  const isDM = room.type === "dm";
  const accent = room.color || accentFor(room.id);

  if (isDM) {
    const user = room.otherUser || {};
    return (
      <motion.div
        style={{ position: "relative", flexShrink: 0 }}
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            style={{
              width: 46, height: 46, borderRadius: "50%",
              objectFit: "cover", display: "block",
              border: isActive ? `2px solid ${accent}88` : "2px solid #2e2e45",
              boxShadow: isActive ? `0 0 0 2px ${accent}44, 0 4px 16px ${accent}30` : "0 3px 10px rgba(0,0,0,0.3)",
            }}
          />
        ) : (
          <div style={{
            width: 46, height: 46, borderRadius: "50%",
            background: `linear-gradient(140deg, ${accent}66, ${accent})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: "white", fontSize: 18,
          }}>
            {initial(user.name)}
          </div>
        )}
        {user.online && (
          <div style={{ position: "absolute", bottom: 0, right: 0 }}>
            <PulseDot borderColor="#13131a" />
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{
        flexShrink: 0, width: 46, height: 46, borderRadius: 14,
        overflow: "hidden", position: "relative",
        boxShadow: isActive ? `0 0 0 2px ${accent}55, 0 6px 20px ${accent}35` : "0 3px 10px rgba(0,0,0,0.3)",
      }}
      whileHover={{ scale: 1.06, rotate: -2 }}
      transition={{ type: "spring", stiffness: 280, damping: 18 }}
    >
      {room.image ? (
        <img src={room.image} alt={room.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          background: `linear-gradient(140deg, ${accent}66, ${accent})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "white", fontSize: 18,
        }}>
          {initial(room.name)}
        </div>
      )}
      <div style={{ position: "absolute", bottom: -3, right: -3 }}>
        <PulseDot borderColor="#13131a" />
      </div>
    </motion.div>
  );
};

// ── RoomRow ───────────────────────────────────────────────────────────────────

const RoomRow = ({ room, isActive, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  const displayName = room.type === "dm"
    ? (room.otherUser?.name ?? "Unknown User")
    : (room.name ?? "Untitled Room");

  return (
    <motion.div
      variants={rowVariants}
      style={{ position: "relative", marginBottom: 2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <AnimatePresence>
        {isActive && (
          <motion.div
            key={"bg-" + room.id}
            style={{
              position: "absolute", inset: "0 8px", borderRadius: 16,
              background: "linear-gradient(135deg, #1e1e2e 0%, #1a1a2e 100%)",
              border: "1px solid #2e2e45",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isActive && hovered && (
          <motion.div
            key={"hover-" + room.id}
            style={{ position: "absolute", inset: "0 8px", borderRadius: 16, background: "#17172299" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActive && (
          <motion.div
            key={"bar-" + room.id}
            style={{
              position: "absolute", left: 8, top: 10, bottom: 10,
              width: 3, borderRadius: 99,
              background: "linear-gradient(to bottom, #6366f1, #a855f7)",
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => onSelect(room)}
        whileTap={{ scale: 0.975 }}
        style={{
          position: "relative", zIndex: 1,
          width: "100%", display: "flex", alignItems: "center",
          gap: 14, padding: "11px 16px 11px 20px",
          borderRadius: 16, textAlign: "left",
          background: "transparent", border: "none", cursor: "pointer",
        }}
      >
        <RoomAvatar room={room} isActive={isActive} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
            <motion.span
              animate={{ color: isActive ? "#e8e4dc" : hovered ? "#d4cfc9" : "#b0aac4" }}
              transition={{ duration: 0.18 }}
              style={{ fontSize: 13.5, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {displayName}
            </motion.span>
            <motion.span
              animate={{ opacity: isActive || hovered ? 0.75 : 0.4 }}
              style={{ fontSize: 10, color: "#6b6880", flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}
            >
              {room.time}
            </motion.span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <motion.p
              animate={{ color: isActive ? "#7b7592" : "#4e4a60" }}
              style={{ fontSize: 11.5, fontFamily: "'DM Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1, margin: 0 }}
            >
              {room.lastMessage}
            </motion.p>
            <AnimatePresence>
              {room.unread > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  style={{
                    flexShrink: 0, minWidth: 20, height: 20, padding: "0 6px",
                    borderRadius: 99, background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "white", fontSize: 9, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 10px rgba(99,102,241,0.5)", fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {room.unread}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
};

// ── SectionLabel ──────────────────────────────────────────────────────────────

const SectionLabel = ({ label, count }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.28, duration: 0.35 }}
    style={{ padding: "12px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}
  >
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "#4e4a60", textTransform: "uppercase" }}>
      {label}
    </span>
    <span style={{ fontSize: 10, fontWeight: 600, color: "#4e4a60", background: "#1e1e2e", border: "1px solid #2a2a38", borderRadius: 99, padding: "1px 8px" }}>
      {count}
    </span>
  </motion.div>
);

// ── ComposeDropdown ───────────────────────────────────────────────────────────

const ComposeDropdown = ({ onNewDM, onNewGroup, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const items = [
    {
      label: "New Direct Message",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      action: onNewDM,
    },
    {
      label: "New Group",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      action: onNewGroup,
    },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.88, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      style={{
        position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100,
        background: "#1e1e2e", border: "1px solid #2e2e45",
        borderRadius: 14, padding: 6, minWidth: 200,
        boxShadow: "0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px #2a2a3855",
      }}
    >
      {items.map((item, i) => (
        <motion.button
          key={i}
          onClick={() => { item.action(); onClose(); }}
          whileHover={{ backgroundColor: "#252535", color: "#a78bfa" }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 10,
            background: "transparent", border: "none", cursor: "pointer",
            color: "#b0aac4", fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 500, textAlign: "left",
          }}
        >
          <span style={{ color: "#6366f1", display: "flex" }}>{item.icon}</span>
          {item.label}
        </motion.button>
      ))}
    </motion.div>
  );
};

// ── Modal Shell ───────────────────────────────────────────────────────────────

const Modal = ({ children, onClose }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#13131a", border: "1px solid #2a2a38",
            borderRadius: 20, padding: 28, width: 420, maxWidth: "90vw",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px #2e2e4555",
            position: "relative",
          }}
        >
          {/* Close button */}
          <motion.button
            onClick={onClose}
            whileHover={{ backgroundColor: "#252535", color: "#e8e4dc" }}
            whileTap={{ scale: 0.9 }}
            style={{
              position: "absolute", top: 16, right: 16,
              width: 30, height: 30, borderRadius: 8,
              background: "#1e1e2e", border: "1px solid #2a2a38",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#4e4a60", cursor: "pointer",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── DMModal ───────────────────────────────────────────────────────────────────

const DMModal = ({ onClose, onCreated }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const handleSearch = (val) => {
    setQuery(val);
    setError("");
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers(val.trim());
        setResults(res.data.users || []);
      } catch {
        setError("Search failed. Try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = async (user) => {
    setCreating(true);
    setError("");
    try {
      await createDMRoom(user._id);
      onCreated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not start DM.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e4dc", fontFamily: "'DM Serif Display', serif", marginBottom: 4 }}>
          New Direct Message
        </h2>
        <p style={{ fontSize: 12, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>
          Search by username to start a conversation
        </p>
      </div>

      {/* Search input */}
      <motion.div
        animate={{ boxShadow: "0 0 0 1.5px #6366f1, 0 0 18px rgba(99,102,241,0.12)" }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#1e1e2e", border: "1px solid #2e2e45",
          borderRadius: 12, padding: "11px 14px", marginBottom: 14,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search username..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 13.5, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif",
          }}
        />
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            style={{ width: 14, height: 14, border: "2px solid #2e2e45", borderTopColor: "#6366f1", borderRadius: "50%" }}
          />
        )}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ fontSize: 12, color: "#f87171", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Results */}
      <div style={{ maxHeight: 240, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#252535 transparent" }}>
        <AnimatePresence>
          {results.length > 0 && results.map((user, i) => (
            <motion.button
              key={user._id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSelect(user)}
              disabled={creating}
              whileHover={{ backgroundColor: "#1e1e2e" }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 12, marginBottom: 4,
                background: "transparent", border: "1px solid transparent",
                cursor: creating ? "not-allowed" : "pointer", textAlign: "left",
              }}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #2e2e45" }} />
              ) : (
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(140deg, #6366f166, #6366f1)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, color: "white", fontSize: 15,
                }}>
                  {initial(user.username)}
                </div>
              )}
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif", margin: 0, marginBottom: 2 }}>
                  {user.username}
                </p>
                {user.email && (
                  <p style={{ fontSize: 11, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                    {user.email}
                  </p>
                )}
              </div>
              <motion.div
                style={{ marginLeft: "auto", color: "#6366f1", display: "flex" }}
                whileHover={{ scale: 1.2 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </motion.div>
            </motion.button>
          ))}
        </AnimatePresence>

        {!loading && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "28px 0" }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
            <p style={{ fontSize: 13, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>
              No users found for "{query}"
            </p>
          </motion.div>
        )}

        {!query && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "28px 0" }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
            <p style={{ fontSize: 13, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>
              Type a username to search
            </p>
          </motion.div>
        )}
      </div>

      {creating && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ fontSize: 12, color: "#a78bfa", fontFamily: "'DM Sans', sans-serif", textAlign: "center", marginTop: 12 }}
        >
          Starting conversation...
        </motion.p>
      )}
    </>
  );
};

// ── GroupModal ────────────────────────────────────────────────────────────────

const GroupModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchError, setSearchError] = useState("");
  const debounceRef = useRef(null);

  const handleSearchMembers = (val) => {
    setQuery(val);
    setSearchError("");
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers(val.trim());
        setResults(res.data.users || []);
      } catch {
        setSearchError("Search failed. Try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleToggleMember = (user) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m._id === user._id);
      if (exists) {
        return prev.filter((m) => m._id !== user._id);
      }
      return [...prev, user];
    });
    setError("");
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError("Please enter a group name."); return; }
    if (selectedMembers.length === 0) { setError("Please add at least one member."); return; }
    setCreating(true);
    setError("");
    try {
      await createRoom({
        roomName: name.trim(),
        members: selectedMembers.map((u) => u._id),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create group.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e4dc", fontFamily: "'DM Serif Display', serif", marginBottom: 4 }}>
          New Group
        </h2>
        <p style={{ fontSize: 12, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>
          Give your group a name and add members
        </p>
      </div>

      <motion.div
        animate={{
          boxShadow: focused ? "0 0 0 1.5px #6366f1, 0 0 18px rgba(99,102,241,0.12)" : "0 0 0 1px #2a2a38",
          background: focused ? "#252535" : "#1e1e2e",
        }}
        transition={{ duration: 0.2 }}
        style={{ borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          placeholder="e.g. Design Team, Friends, Etc."
          maxLength={50}
          style={{
            width: "100%", background: "transparent", border: "none", outline: "none",
            fontSize: 14, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif",
          }}
        />
      </motion.div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ fontSize: 12, color: "#f87171", fontFamily: "'DM Sans', sans-serif", margin: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <span style={{ fontSize: 11, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif", marginLeft: "auto" }}>
          {name.length}/50
        </span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#b0aac4", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
          Add members
        </p>
        <p style={{ fontSize: 11, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
          Search by username to add people to this group
        </p>
      </div>

      <motion.div
        animate={{ boxShadow: "0 0 0 1.5px #6366f1, 0 0 18px rgba(99,102,241,0.12)" }}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#1e1e2e", border: "1px solid #2e2e45",
          borderRadius: 12, padding: "11px 14px", marginBottom: 10,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={query}
          onChange={(e) => handleSearchMembers(e.target.value)}
          placeholder="Search username..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 13.5, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif",
          }}
        />
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            style={{ width: 14, height: 14, border: "2px solid #2e2e45", borderTopColor: "#6366f1", borderRadius: "50%" }}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {searchError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ fontSize: 12, color: "#f87171", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}
          >
            {searchError}
          </motion.p>
        )}
      </AnimatePresence>

      <div style={{ maxHeight: 180, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#252535 transparent", marginBottom: 10 }}>
        <AnimatePresence>
          {results.length > 0 && results.map((user, i) => {
            const isSelected = selectedMembers.some((m) => m._id === user._id);
            return (
              <motion.button
                key={user._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleToggleMember(user)}
                disabled={creating}
                whileHover={{ backgroundColor: "#1e1e2e" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 12, marginBottom: 4,
                  background: isSelected ? "#1e1e2e" : "transparent",
                  border: isSelected ? "1px solid #6366f1" : "1px solid transparent",
                  cursor: creating ? "not-allowed" : "pointer", textAlign: "left",
                }}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #2e2e45" }} />
                ) : (
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(140deg, #6366f166, #6366f1)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "white", fontSize: 15,
                  }}>
                    {initial(user.username)}
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif", margin: 0, marginBottom: 2 }}>
                    {user.username}
                  </p>
                  {user.email && (
                    <p style={{ fontSize: 11, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                      {user.email}
                    </p>
                  )}
                </div>
                <motion.span
                  style={{
                    marginLeft: "auto",
                    minWidth: 20,
                    height: 20,
                    padding: "0 8px",
                    borderRadius: 99,
                    background: isSelected ? "linear-gradient(135deg, #6366f1, #a855f7)" : "#1e1e2e",
                    color: isSelected ? "white" : "#6b6880",
                    fontSize: 10,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {isSelected ? "Added" : "Add"}
                </motion.span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {!loading && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "20px 0" }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
            <p style={{ fontSize: 13, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>
              No users found for "{query}"
            </p>
          </motion.div>
        )}

        {!query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "20px 0" }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
            <p style={{ fontSize: 13, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>
              Type a username to search
            </p>
          </motion.div>
        )}
      </div>

      {selectedMembers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>
            Selected members
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {selectedMembers.map((user) => (
              <motion.div
                key={user._id}
                whileHover={{ scale: 1.03 }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "#1e1e2e",
                  border: "1px solid #2e2e45",
                  fontSize: 11,
                  color: "#e8e4dc",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700,
                }}>
                  {initial(user.username)}
                </span>
                <span style={{ maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.username}
                </span>
                <button
                  onClick={() => handleToggleMember(user)}
                  style={{
                    marginLeft: 4,
                    background: "none",
                    border: "none",
                    color: "#6b6880",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <motion.button
        onClick={handleCreate}
        disabled={creating || !name.trim()}
        whileHover={!creating && name.trim() ? { scale: 1.02, boxShadow: "0 8px 28px rgba(99,102,241,0.45)" } : {}}
        whileTap={!creating && name.trim() ? { scale: 0.97 } : {}}
        style={{
          width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
          background: creating || !name.trim()
            ? "#1e1e2e"
            : "linear-gradient(135deg, #6366f1, #a855f7)",
          color: creating || !name.trim() ? "#4e4a60" : "white",
          fontSize: 14, fontWeight: 600, cursor: creating || !name.trim() ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "background 0.2s, color 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        {creating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              style={{ width: 14, height: 14, border: "2px solid #4e4a60", borderTopColor: "#a78bfa", borderRadius: "50%" }}
            />
            Creating...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Group
          </>
        )}
      </motion.button>
    </>
  );
};

const ProfileModal = ({ onClose }) => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.username || user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", name.trim());
      if (avatarFile) {
        formData.append("avatarUrl", avatarFile);
      }
      const res = await updateProfile(formData);
      if (res?.data?.data?.user) {
        setUser(res.data.data.user);
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e4dc", fontFamily: "'DM Serif Display', serif", marginBottom: 4 }}>
          Edit Profile
        </h2>
        <p style={{ fontSize: 12, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>
          Update your display name and avatar
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            overflow: "hidden",
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #2e2e45",
          }}
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={name || "You"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "white",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {(name || "Y").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 11,
              color: "#4e4a60",
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 6,
            }}
          >
            Avatar
          </p>
          <motion.button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            whileHover={{ scale: 1.03, backgroundColor: "#252535" }}
            whileTap={{ scale: 0.96 }}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #2e2e45",
              background: "#1a1a26",
              color: "#e8e4dc",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Change picture
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p
          style={{
            fontSize: 11,
            color: "#4e4a60",
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 6,
          }}
        >
          Display name
        </p>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          maxLength={40}
          style={{
            width: "100%",
            background: "#1e1e2e",
            border: "1px solid #2e2e45",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 14,
            color: "#e8e4dc",
            fontFamily: "'DM Sans', sans-serif",
            outline: "none",
          }}
        />
      </div>

      {error && (
        <p
          style={{
            fontSize: 12,
            color: "#f87171",
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 10,
          }}
        >
          {error}
        </p>
      )}

      <motion.button
        onClick={handleSave}
        disabled={saving}
        whileHover={
          saving
            ? {}
            : {
              scale: 1.02,
              boxShadow: "0 8px 28px rgba(99,102,241,0.45)",
            }
        }
        whileTap={saving ? {} : { scale: 0.97 }}
        style={{
          width: "100%",
          padding: "13px 0",
          borderRadius: 12,
          border: "none",
          background: saving
            ? "#1e1e2e"
            : "linear-gradient(135deg, #6366f1, #a855f7)",
          color: saving ? "#4e4a60" : "white",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          cursor: saving ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {saving ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              style={{
                width: 14,
                height: 14,
                border: "2px solid #4e4a60",
                borderTopColor: "#a78bfa",
                borderRadius: "50%",
              }}
            />
            Saving...
          </>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
            Save changes
          </>
        )}
      </motion.button>
    </>
  );
};

// ── RoomList (main) ───────────────────────────────────────────────────────────

export default function RoomList({ rooms = [], activeRoomId, onSelectRoom, currentUser = {} }) {
  const [searchTerm, setSearchTerm] = useState("");

  const trimmedQuery = searchTerm.trim().toLowerCase();
  const filterText = (str) => (str || "").toLowerCase();

  const filteredRooms = !trimmedQuery
    ? rooms
    : rooms.filter((room) => {
      const isDM = room.type === "dm";
      const name = isDM ? room.otherUser?.name : room.name;
      const lastMessage = room.lastMessage;
      return (
        filterText(name).includes(trimmedQuery) ||
        filterText(lastMessage).includes(trimmedQuery)
      );
    });

  const groupRooms = filteredRooms.filter((r) => r.type === "group");
  const dmRooms = filteredRooms.filter((r) => r.type === "dm");

  const { setROOMS, setActiveRoom } = useChatRes();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modal, setModal] = useState(null); // "dm" | "group" | null
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const plusBtnRef = useRef(null);

  const handleSubmitSearch = () => {
    if (!trimmedQuery) return;
    const first = filteredRooms[0];
    if (first) {
      onSelectRoom(first);
    }
  };

  // After creating a room — refetch rooms
  const handleCreated = async () => {
    try {
      const { getRooms } = await import("../Services/service");
      const res = await getRooms();
      const { shapeRoom } = await import("../utils/ShapeRoom");
      const shaped = res.data.roomsMod.map((r) => shapeRoom(r));
      setROOMS(shaped);
      // Auto-select the newest room (last in list)
      if (shaped.length > 0) {
        setActiveRoom(shaped[shaped.length - 1]);
      }
    } catch (err) {
      console.error("Failed to refresh rooms:", err);
    }
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="show"
        style={{
          display: "flex", flexDirection: "column",
          height: "100%", background: "#13131a",
          borderRight: "1px solid #2a2a38",
          userSelect: "none", overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ padding: "24px 20px 18px", flexShrink: 0 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <motion.div
                style={{
                  width: 40, height: 40, borderRadius: 13,
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.92 }}
                animate={{ boxShadow: ["0 4px 16px rgba(99,102,241,0.4)", "0 4px 24px rgba(168,85,247,0.55)", "0 4px 16px rgba(99,102,241,0.4)"] }}
                transition={{ boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }, scale: { type: "spring", stiffness: 300, damping: 14 } }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </motion.div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: "0.1em", lineHeight: 1, fontFamily: "'DM Serif Display', serif" }}>
                  ZYNC
                </div>
                <motion.div
                  style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", marginTop: 3 }}
                  animate={{ color: ["#6366f1", "#a855f7", "#6366f1"] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  ● LIVE
                </motion.div>
              </div>
            </div>

            {/* ── + Button with dropdown ── */}
            <div style={{ position: "relative" }} ref={plusBtnRef}>
              <motion.button
                onClick={() => setDropdownOpen((prev) => !prev)}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: dropdownOpen ? "#252535" : "#1e1e2e",
                  border: dropdownOpen ? "1px solid #6366f1" : "1px solid #2a2a38",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: dropdownOpen ? "#a78bfa" : "#6b6880", cursor: "pointer",
                }}
                whileHover={{ scale: 1.08, backgroundColor: "#252535", borderColor: "#6366f1", color: "#a78bfa" }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 350, damping: 18 }}
              >
                <motion.div
                  animate={{ rotate: dropdownOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <ComposeDropdown
                    onNewDM={() => setModal("dm")}
                    onNewGroup={() => setModal("group")}
                    onClose={() => setDropdownOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSubmit={handleSubmitSearch}
          />
        </motion.div>

        {/* ── Room list ── */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          style={{ flex: 1, overflowY: "auto", paddingBottom: 12, scrollbarWidth: "thin", scrollbarColor: "#252535 transparent" }}
        >
          {groupRooms.length > 0 && (
            <>
              <SectionLabel label="Channels" count={groupRooms.length} />
              {groupRooms.map((room) => (
                <RoomRow key={room.id} room={room} isActive={room.id === activeRoomId} onSelect={onSelectRoom} />
              ))}
            </>
          )}
          {dmRooms.length > 0 && (
            <>
              <SectionLabel label="Direct Messages" count={dmRooms.length} />
              {dmRooms.map((room) => (
                <RoomRow key={room.id} room={room} isActive={room.id === activeRoomId} onSelect={onSelectRoom} />
              ))}
            </>
          )}
          {rooms.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
              <p style={{ fontSize: 13, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>No rooms yet</p>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom fade */}
        <div style={{ height: 28, marginTop: -28, flexShrink: 0, pointerEvents: "none", background: "linear-gradient(to top, #13131a, transparent)" }} />

        {/* Divider */}
        <div style={{ height: 1, background: "#2a2a38", margin: "0 16px", flexShrink: 0 }} />

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ padding: "14px 14px 18px", flexShrink: 0 }}
        >
          <motion.div
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: "#1a1a26", border: "1px solid #2a2a38", cursor: "pointer" }}
            whileHover={{ backgroundColor: "#1e1e2e", borderColor: "#6366f130", boxShadow: "0 0 0 1px #6366f122, 0 6px 24px rgba(0,0,0,0.3)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => setProfileModalOpen(true)}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              {currentUser.avatarUrl ? (
                <motion.img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name || "You"}
                  style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", display: "block", border: "2px solid #2e2e45" }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                />
              ) : (
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "white", border: "2px solid #2e2e45" }}>
                  {initial(currentUser.name || "Y")}
                </div>
              )}
              <motion.div
                style={{ position: "absolute", inset: -2, borderRadius: "50%", border: "2px solid transparent" }}
                animate={{ borderColor: ["#34d39955", "#34d39900", "#34d39955"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div style={{ position: "absolute", bottom: 1, right: 1 }}>
                <PulseDot borderColor="#1a1a26" />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "#e8e4dc", lineHeight: 1, marginBottom: 5 }}>{currentUser.name || "You"}</p>
              <p style={{ fontSize: 11, color: "#34d399", fontWeight: 500, lineHeight: 1 }}>● Online</p>
            </div>
            <motion.button
              style={{ background: "none", border: "none", cursor: "pointer", color: "#4e4a60", padding: 6, borderRadius: 8, display: "flex" }}
              whileHover={{ color: "#a78bfa", backgroundColor: "#252535", rotate: 45 }}
              transition={{ type: "spring", stiffness: 280, damping: 14 }}
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Modals (rendered outside sidebar so they overlay full screen) ── */}
      <AnimatePresence>
        {modal === "dm" && (
          <Modal onClose={() => setModal(null)}>
            <DMModal onClose={() => setModal(null)} onCreated={handleCreated} />
          </Modal>
        )}
        {modal === "group" && (
          <Modal onClose={() => setModal(null)}>
            <GroupModal onClose={() => setModal(null)} onCreated={handleCreated} />
          </Modal>
        )}
        {profileModalOpen && (
          <Modal onClose={() => setProfileModalOpen(false)}>
            <ProfileModal onClose={() => setProfileModalOpen(false)} />
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
