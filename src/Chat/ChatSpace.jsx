import { motion, AnimatePresence } from "framer-motion";
import { useContext, useEffect, useRef, useState } from "react";
import { MessageContext } from "../Contexts/MessageContext.jsx/MessageContext";
import useChatRes from "../Contexts/ChatContext.jsx/ChatHook";
import useMessageRes from "../Contexts/MessageContext.jsx/MessageHook";
import { socket } from "../Socket/socket";
import { useAuth } from "../Contexts/AuthHook";
import { createDMRoom, getRooms, updateRoom, leaveRoom } from "../Services/service";
import { shapeRoom } from "../utils/ShapeRoom";
import { Maximize, Minimize } from "lucide-react";
import {
  addTrackToPeerConnection,
  cleanUp,
  createOffer,
  getUserMedia,
  listenForIceCandidates,
  createAnswer,
  createPeerConnection,
  setRemoteDescription,
  addIceCandidate,
} from "../WebRtc/UseWebRTC";

// ── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d0d0f", gap: 16 }}
  >
    <motion.div
      style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}
      animate={{ boxShadow: ["0 0 20px rgba(99,102,241,0.3)", "0 0 40px rgba(168,85,247,0.5)", "0 0 20px rgba(99,102,241,0.3)"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
    </motion.div>
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 18, fontWeight: 600, color: "#e8e4dc", fontFamily: "'DM Serif Display', serif", marginBottom: 8 }}>Welcome to ZYNC</p>
      <p style={{ fontSize: 13, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>Select a room to start chatting</p>
    </div>
  </motion.div>
);

// ── HeaderAvatar ──────────────────────────────────────────────────────────────

const HeaderAvatar = ({ room }) => {
  if (!room) return null;
  const isDM = room.type === "dm";
  const src = isDM ? room.otherUser?.avatar : room.image;
  const name = isDM ? room.otherUser?.name : room.name;
  const color = room.color || "#6366f1";
  const initial = (name || "?").charAt(0).toUpperCase();
  if (src) return <img src={src} alt={name} style={{ width: 38, height: 38, borderRadius: isDM ? "50%" : 12, objectFit: "cover", border: `2px solid ${color}55`, boxShadow: `0 0 12px ${color}33`, flexShrink: 0 }} />;
  return <div style={{ width: 38, height: 38, borderRadius: isDM ? "50%" : 12, background: `linear-gradient(135deg, ${color}88, ${color})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 16, flexShrink: 0, boxShadow: `0 0 12px ${color}33` }}>{initial}</div>;
};

// ── ChatHeader ────────────────────────────────────────────────────────────────

const ChatHeader = ({ room, onOpenEdit, callState, onStartCall }) => {
  const isDM = room.type === "dm";
  const name = isDM ? room.otherUser?.name : room.name;
  const isOnline = isDM ? room.otherUser?.online : false;
  const memberCount = room.members?.length ?? 0;
  const [membersOpen, setMembersOpen] = useState(false);
  const [creatingDmFor, setCreatingDmFor] = useState(null);
  const menuRef = useRef(null);
  const { user } = useAuth();
  const { setROOMS, setActiveRoom } = useChatRes();
  const inCall = !!callState;

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMembersOpen(false); };
    if (membersOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [membersOpen]);

  const handleStartDm = async (member) => {
    if (!member || !member._id) return;
    setCreatingDmFor(member._id);
    try {
      const res = await createDMRoom(member._id);
      if (res.data?.alreadtyExists) {
        const shaped = shapeRoom(res.data.room); setActiveRoom(shaped); return;
      }
      const resAllRoom = await getRooms();
      const shaped = resAllRoom.data.roomsMod.map((r) => shapeRoom(r));
      setROOMS(shaped);
      const dm = shaped.find((r) => r.type === "dm" && r.otherUser?.id === member._id);
      if (dm) setActiveRoom(dm);
    } catch (err) { console.log(err); }
    finally { setCreatingDmFor(null); setMembersOpen(false); }
  };

  const members = !isDM ? (room.members || []).filter((m) => m && m._id !== user?._id) : [];

  return (
    <motion.div
      key={room.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "#13131a", borderBottom: "1px solid #2a2a38", flexShrink: 0 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <HeaderAvatar room={room} />
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif", lineHeight: 1, marginBottom: 4 }}>{name}</p>
          {isDM ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <motion.span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: isOnline ? "#34d399" : "#4e4a60", display: "inline-block" }} animate={isOnline ? { boxShadow: ["0 0 3px #34d399", "0 0 8px #34d399", "0 0 3px #34d399"] } : {}} transition={{ duration: 2, repeat: Infinity }} />
              <span style={{ fontSize: 11, color: isOnline ? "#34d399" : "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>{isOnline ? "Online" : "Offline"}</span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <motion.span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#34d399", display: "inline-block" }} animate={{ boxShadow: ["0 0 3px #34d399", "0 0 8px #34d399", "0 0 3px #34d399"] }} transition={{ duration: 2, repeat: Infinity }} />
              <span style={{ fontSize: 11, color: "#7b7592", fontFamily: "'DM Sans', sans-serif" }}>{memberCount} members</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {isDM && (
          <>
            <motion.button onClick={() => !inCall && onStartCall("audio")} disabled={inCall} title={inCall ? "Already in a call" : "Voice call"}
              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "transparent", border: "none", color: inCall ? "#2e2e45" : "#4e4a60", cursor: inCall ? "not-allowed" : "pointer" }}
              whileHover={!inCall ? { backgroundColor: "#1e1e2e", color: "#34d399", scale: 1.08 } : {}} whileTap={!inCall ? { scale: 0.92 } : {}} transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </motion.button>
            <motion.button onClick={() => !inCall && onStartCall("video")} disabled={inCall} title={inCall ? "Already in a call" : "Video call"}
              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "transparent", border: "none", color: inCall ? "#2e2e45" : "#4e4a60", cursor: inCall ? "not-allowed" : "pointer", marginRight: 4 }}
              whileHover={!inCall ? { backgroundColor: "#1e1e2e", color: "#a78bfa", scale: 1.08 } : {}} whileTap={!inCall ? { scale: 0.92 } : {}} transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
            </motion.button>
          </>
        )}
        {!isDM && (
          <>
            <motion.button onClick={onOpenEdit} style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "transparent", border: "none", color: "#4e4a60", cursor: "pointer" }} whileHover={{ backgroundColor: "#1e1e2e", color: "#a78bfa", scale: 1.08 }} whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18.999l-4 1 1-4 11.5-12.5z" /></svg>
            </motion.button>
            <div style={{ position: "relative" }} ref={menuRef}>
              <motion.button onClick={() => setMembersOpen((p) => !p)} style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "transparent", border: "none", color: "#4e4a60", cursor: "pointer" }} whileHover={{ backgroundColor: "#1e1e2e", color: "#a78bfa", scale: 1.08 }} whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </motion.button>
              <AnimatePresence>
                {membersOpen && members.length > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -6 }} transition={{ type: "spring", stiffness: 400, damping: 26 }}
                    style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: 220, maxHeight: 260, overflowY: "auto", background: "#1e1e2e", border: "1px solid #2e2e45", borderRadius: 14, padding: 8, boxShadow: "0 16px 40px rgba(0,0,0,0.5)", zIndex: 50 }}
                  >
                    {members.map((member) => {
                      const online = member.online;
                      const displayName = member.username || member.name || "Member";
                      return (
                        <motion.div key={member._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} whileHover={{ backgroundColor: "#252535" }}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer", marginBottom: 4 }}
                        >
                          {member.avatarUrl
                            ? <img src={member.avatarUrl} alt={displayName} style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "2px solid #2e2e45" }} />
                            : <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>{(displayName || "?").charAt(0).toUpperCase()}</div>}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: online ? "#34d399" : "#4e4a60" }} />
                            </div>
                            <span style={{ fontSize: 11, color: online ? "#34d399" : "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>{online ? "Online" : "Offline"}</span>
                          </div>
                          <motion.button disabled={creatingDmFor === member._id} onClick={() => handleStartDm(member)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
                            style={{ border: "none", borderRadius: 999, padding: "4px 10px", fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", background: creatingDmFor === member._id ? "#1e1e2e" : "linear-gradient(135deg, #6366f1, #a855f7)", color: creatingDmFor === member._id ? "#4e4a60" : "white", cursor: creatingDmFor === member._id ? "not-allowed" : "pointer" }}
                          >{creatingDmFor === member._id ? "Opening..." : "Message"}</motion.button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ── MessageBubble ─────────────────────────────────────────────────────────────

const MessageBubble = ({ msg, currentUserId }) => {

  const [fullScreenImage, setFullScreenImage] = useState(false);

  if (msg?.type === "call-log") {
    return (
      <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 330, damping: 25 }}
        style={{ display: "flex", justifyContent: "center", padding: "6px 20px" }}
      >
        <div style={{ maxWidth: "82%", borderRadius: 999, padding: "8px 14px", border: "1px solid #2e2e45", background: "#151520", color: "#9a93b3", fontSize: 11.5, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          <span>{msg.callType === "video" ? "📹" : "📞"}</span>
          <span>{msg.content}</span>
        </div>
      </motion.div>
    );
  }

  const isOwn = msg.sender._id === currentUserId;
  const imageSource = msg.imageUrl || msg.image || msg.imageURL;
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 340, damping: 26 }}
      style={{ display: "flex", flexDirection: isOwn ? "row-reverse" : "row", alignItems: "flex-end", gap: 10, padding: "3px 20px" }}
    >
      {!isOwn && <img src={msg.sender.avatarUrl} alt={msg.sender.username} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #2e2e45" }} />}
      <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
        {!isOwn && <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, marginBottom: 3, marginLeft: 4, fontFamily: "'DM Sans', sans-serif" }}>{msg.sender.username}</span>}
        {(msg.content || !imageSource) && (
          <div style={{ padding: "10px 14px", borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isOwn ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#1e1e2e", border: isOwn ? "none" : "1px solid #2e2e45", color: isOwn ? "white" : "#e8e4dc", fontSize: 13.5, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif", boxShadow: isOwn ? "0 4px 14px rgba(99,102,241,0.35)" : "none", wordBreak: "break-word", marginBottom: imageSource ? 6 : 0 }}>
            {msg.content}
          </div>
        )}
        {imageSource && (
          <div
            onClick={() => {
              setFullScreenImage(true);
            }}
            style={{ marginTop: msg.content ? 0 : 4, borderRadius: 14, overflow: "hidden", border: "1px solid #2e2e45", maxWidth: 260, boxShadow: "0 4px 16px rgba(0,0,0,0.45)" }}>
            <img src={imageSource} alt="attachment" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", backgroundColor: "#050509" }} />
          </div>
        )}
        {imageSource && fullScreenImage && (
          <div
            onClick={() => {
              setFullScreenImage(false);
            }}
            style={{ zIndex: 999, position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: msg.content ? 0 : 4, borderRadius: 14, overflow: "hidden", border: "1px solid #2e2e45", maxWidth: "100vw", boxShadow: "0 4px 16px rgba(0,0,0,0.45)" }}>
            <img src={imageSource} alt="attachment" style={{ display: "block", width: "60%", height: "80%", objectFit: "contain", backgroundColor: "#050509", boxShadow: "0 4px 16px rgba(0,0,0,0.45)" }} />
          </div>
        )}
        <span style={{ fontSize: 10, color: "#4e4a60", marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", day: "2-digit" })}</span>
      </div>
    </motion.div>
  );
};

// ── MessageArea ───────────────────────────────────────────────────────────────

const MessageArea = ({ room }) => {
  const { messages, loadMore } = useMessageRes();
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const { isTyping } = useMessageRes();
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  return (
    <motion.div onScroll={(e) => { if (e.target.scrollTop === 0) loadMore(); }} key={room.id + "-messages"} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ flex: 1, overflowY: "auto", background: "#0d0d0f", display: "flex", flexDirection: "column", padding: "16px 0", scrollbarWidth: "thin", scrollbarColor: "#252535 transparent" }}
    >
      {messages?.length === 0
        ? <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ fontSize: 13, color: "#2e2e45", fontFamily: "'DM Sans', sans-serif" }}>No messages yet. Say hello! 👋</p></div>
        : messages?.map((msg) => <MessageBubble key={msg._id} msg={msg} currentUserId={user._id} />)}
      {isTyping && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 20px" }}>
          <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#1e1e2e", borderRadius: "18px 18px 18px 4px", border: "1px solid #2e2e45" }}>
            {[0, 1, 2].map((i) => <motion.span key={i} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#6366f1", display: "block" }} animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} />)}
          </div>
        </motion.div>
      )}
      <div ref={bottomRef} />
    </motion.div>
  );
};

// ── InputPlaceholder ──────────────────────────────────────────────────────────

const InputPlaceholder = ({ room }) => {
  const isDM = room.type === "dm";
  const name = isDM ? room.otherUser?.name : room.name;
  const [msg, setMsg] = useState("");
  const { sendMessages } = useContext(MessageContext);
  const { ActiveRoom } = useChatRes();
  const typingTimeout = useRef(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiBtnRef = useRef(null);
  const emojiPanelRef = useRef(null);
  const [emojis, setEmojis] = useState([]);
  const [emojiLoading, setEmojiLoading] = useState(false);
  const [emojiError, setEmojiError] = useState("");
  const [emojiQuery, setEmojiQuery] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const attachmentInputRef = useRef(null);

  const loadEmojis = async () => {
    if (emojiLoading || emojis.length > 0) return;
    setEmojiLoading(true); setEmojiError("");
    try { const res = await fetch("https://unpkg.com/emoji.json@13.1.0/emoji.json"); const data = await res.json(); setEmojis(Array.isArray(data) ? data : []); }
    catch { setEmojis([]); setEmojiError("Could not load emojis"); }
    finally { setEmojiLoading(false); }
  };

  useEffect(() => {
    const handler = (e) => {
      if (emojiBtnRef.current?.contains(e.target)) return;
      if (emojiPanelRef.current?.contains(e.target)) return;
      setEmojiOpen(false);
    };
    if (emojiOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [emojiOpen]);

  const handleInputEvent = (e) => {
    setMsg(e.target.value);
    socket.emit("start-typing", ActiveRoom.id);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit("stop-typing", ActiveRoom.id), 1500);
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!msg && !attachmentFile) return;
    sendMessages(msg, attachmentFile);
    setMsg("");
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentFile(null); setAttachmentPreview("");
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentFile(file); setAttachmentPreview(URL.createObjectURL(file));
  };

  useEffect(() => { if (emojiOpen && emojis.length === 0) loadEmojis(); }, [emojiOpen]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ padding: "12px 20px 18px", borderTop: "1px solid #2a2a38", background: "#13131a", flexShrink: 0 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#1e1e2e", border: "1px solid #2e2e45", borderRadius: 16, padding: "12px 16px", position: "relative" }}>
        <motion.button ref={emojiBtnRef} style={{ background: "none", border: "none", cursor: "pointer", color: "#4e4a60", display: "flex", flexShrink: 0 }} whileHover={{ color: "#a78bfa", scale: 1.15, rotate: 10 }} transition={{ type: "spring", stiffness: 350, damping: 15 }} onClick={() => setEmojiOpen((p) => !p)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 13s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
        </motion.button>
        <input placeholder={`Message ${name}...`} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13.5, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif" }} onChange={handleInputEvent} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }} value={msg} />
        <motion.button style={{ background: "none", border: "none", cursor: "pointer", color: attachmentFile ? "#a78bfa" : "#4e4a60", display: "flex", flexShrink: 0 }} whileHover={{ color: "#a78bfa", scale: 1.15, rotate: -8 }} transition={{ type: "spring", stiffness: 350, damping: 15 }} onClick={() => attachmentInputRef.current?.click()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
        </motion.button>
        {attachmentPreview && <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", border: "1px solid #2e2e45", flexShrink: 0 }}><img src={attachmentPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
        <motion.button style={{ width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }} whileHover={{ scale: 1.08, boxShadow: "0 6px 20px rgba(99,102,241,0.55)" }} whileTap={{ scale: 0.92 }} transition={{ type: "spring", stiffness: 380, damping: 18 }} onClick={handleSubmit}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </motion.button>
        <AnimatePresence>
          {emojiOpen && (
            <motion.div ref={emojiPanelRef} initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}
              style={{ position: "absolute", bottom: "110%", left: 8, right: 8, maxHeight: 260, background: "#1e1e2e", border: "1px solid #2e2e45", borderRadius: 16, padding: 10, boxShadow: "0 18px 40px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 60 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "4px 6px 8px", borderBottom: "1px solid #2a2a38" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input value={emojiQuery} onChange={(e) => setEmojiQuery(e.target.value)} placeholder="Search emojis..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: 6, overflowY: "auto", paddingTop: 2 }}>
                {emojiLoading && !emojiError && <span style={{ gridColumn: "1 / -1", textAlign: "center", fontSize: 12, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>Loading emojis...</span>}
                {emojiError && <span style={{ gridColumn: "1 / -1", textAlign: "center", fontSize: 12, color: "#f87171", fontFamily: "'DM Sans', sans-serif" }}>{emojiError}</span>}
                {!emojiLoading && !emojiError && emojis.filter((e) => !emojiQuery.trim() ? true : (e.name || "").toLowerCase().includes(emojiQuery.trim().toLowerCase())).slice(0, 96).map((emoji, i) => (
                  <motion.button key={(emoji.char || emoji.emoji || "") + i} onClick={() => { const s = emoji.char || emoji.emoji; if (s) { setMsg((p) => p + s); setEmojiOpen(false); } }} whileHover={{ scale: 1.2, backgroundColor: "#252535" }} whileTap={{ scale: 0.9 }} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, padding: 4, borderRadius: 8 }}>{emoji.char}</motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <input ref={attachmentInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAttachmentChange} />
    </motion.div>
  );
};

// ── EditGroupModal ────────────────────────────────────────────────────────────

const EditGroupModal = ({ room, onClose }) => {
  const [name, setName] = useState(room.name || "");
  const [avatar, setAvatar] = useState(room.image || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  const { setROOMS, setActiveRoom } = useChatRes();
  const fileInputRef = useRef(null);

  const handleSave = async () => {
    if (!name.trim()) { setError("Please enter a group name."); return; }
    setSaving(true); setError("");
    try {
      const formData = new FormData();
      formData.append("roomName", name.trim());
      if (avatarFile) formData.append("roomImage", avatarFile);
      else if (avatar) formData.append("roomImageUrl", avatar);
      await updateRoom(room.id, formData);
      const res = await getRooms();
      const shaped = res.data.roomsMod.map((r) => shapeRoom(r));
      setROOMS(shaped);
      const updated = shaped.find((r) => r.id === room.id);
      if (updated) setActiveRoom(updated);
      onClose();
    } catch (err) { setError(err?.response?.data?.message || "Could not update group."); }
    finally { setSaving(false); }
  };

  const handleLeave = async () => {
    setLeaving(true); setError("");
    try {
      await leaveRoom(room.id);
      const res = await getRooms();
      const shaped = res.data.roomsMod.map((r) => shapeRoom(r));
      setROOMS(shaped); setActiveRoom(shaped[0] || null); onClose();
    } catch (err) { setError(err?.response?.data?.message || "Could not leave group."); }
    finally { setLeaving(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => { if (typeof reader.result === "string") setAvatar(reader.result); };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", stiffness: 340, damping: 28 }} onClick={(e) => e.stopPropagation()}
          style={{ background: "#13131a", border: "1px solid #2a2a38", borderRadius: 20, padding: 24, width: 420, maxWidth: "90vw", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", position: "relative" }}
        >
          <motion.button onClick={onClose} whileHover={{ backgroundColor: "#252535", color: "#e8e4dc" }} whileTap={{ scale: 0.9 }} style={{ position: "absolute", top: 16, right: 16, width: 30, height: 30, borderRadius: 8, background: "#1e1e2e", border: "1px solid #2a2a38", display: "flex", alignItems: "center", justifyContent: "center", color: "#4e4a60", cursor: "pointer" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </motion.button>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e8e4dc", fontFamily: "'DM Serif Display', serif", marginBottom: 4 }}>Edit Group</h2>
            <p style={{ fontSize: 12, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>Change the group name and picture, or leave this group.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #2e2e45" }}>
              {avatar ? <img src={avatar} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{(name || "?").charAt(0).toUpperCase()}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>Group picture URL</p>
              <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://example.com/image.png" style={{ width: "100%", background: "#1e1e2e", border: "1px solid #2e2e45", borderRadius: 10, padding: "8px 10px", fontSize: 12, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif" }}>Or upload from your device</span>
                <motion.button onClick={() => fileInputRef.current?.click()} whileHover={{ scale: 1.03, backgroundColor: "#252535" }} whileTap={{ scale: 0.96 }} style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #2e2e45", background: "#1a1a26", color: "#e8e4dc", fontSize: 11, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>Choose file</motion.button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: "#4e4a60", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>Group name</p>
            <input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} maxLength={50} style={{ width: "100%", background: "#1e1e2e", border: "1px solid #2e2e45", borderRadius: 10, padding: "9px 12px", fontSize: 14, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif", outline: "none" }} />
          </div>
          {error && <p style={{ fontSize: 12, color: "#f87171", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 4 }}>
            <motion.button onClick={handleLeave} disabled={leaving} whileHover={leaving ? {} : { scale: 1.02, backgroundColor: "#27272f" }} whileTap={leaving ? {} : { scale: 0.97 }} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #2e2e45", background: "#1a1a26", color: "#f87171", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: leaving ? "not-allowed" : "pointer" }}>{leaving ? "Leaving..." : "Leave group"}</motion.button>
            <motion.button onClick={handleSave} disabled={saving} whileHover={saving ? {} : { scale: 1.02, boxShadow: "0 8px 28px rgba(99,102,241,0.45)" }} whileTap={saving ? {} : { scale: 0.97 }} style={{ padding: "10px 18px", borderRadius: 12, border: "none", background: saving ? "#1e1e2e" : "linear-gradient(135deg, #6366f1, #a855f7)", color: saving ? "#4e4a60" : "white", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {saving ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} style={{ width: 14, height: 14, border: "2px solid #4e4a60", borderTopColor: "#a78bfa", borderRadius: "50%" }} />Saving...</> : "Save changes"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── CallOverlay ───────────────────────────────────────────────────────────────

const CallOverlay = ({ callState, onAccept, onReject, onEnd, onToggleMic, onToggleCam, micMuted, cameraOff, duration, remoteAudioRef, remoteVideoRef, localVideoRef, isFullScreen, callContainerRef, toggleFullScreen }) => {
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const Btn = ({ onClick, bg, border, color, size = 50, children, label }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <motion.button onClick={onClick} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }} transition={{ type: "spring", stiffness: 380, damping: 18 }}
        style={{ width: size, height: size, borderRadius: "50%", background: bg, border: `1.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color, boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}
      >{children}</motion.button>
      {label && <span style={{ fontSize: 10, color: "#7b7592", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>}
    </div>
  );

  const PeerAvatar = ({ name, avatar, size = 72, pulse = false }) => (
    <div style={{ position: "relative" }}>
      {pulse && <motion.div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid #6366f155" }} animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />}
      {avatar
        ? <img src={avatar} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "3px solid #2e2e45", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "block" }} />
        : <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "white", border: "3px solid #2e2e45", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>{(name || "?").charAt(0).toUpperCase()}</div>}
    </div>
  );

  // These media elements always live in the DOM even when no call,
  // so the refs are always attached and ready when a call starts.
  const MediaElements = () => (
    <>
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ position: "fixed", width: 1, height: 1, opacity: 0.001, pointerEvents: "none", left: -9999, top: -9999 }}
      />
    </>
  );

  if (!callState) return <MediaElements />;

  const { status, callType, peerName, peerAvatar } = callState;
  const isVideo = callType === "video";
  const isActive = status === "active";

  return (
    <>
      <MediaElements />
      <AnimatePresence>
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.88, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88, y: 24 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          style={{ position: "fixed", bottom: 28, right: 28, zIndex: 1000, width: isVideo && isActive ? 340 : 300, background: "linear-gradient(160deg, #13131a 0%, #1a1a28 100%)", border: "1px solid #2e2e45", borderRadius: 24, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(99,102,241,0.1)" }}
        >
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #6366f1, #a855f7, transparent)" }} />

          {/* Remote video — full width, only shown for active video calls */}
          {isVideo && isActive && (
            <div
              ref={callContainerRef}
              className={`relative bg-[#080810] overflow-hidden ${isFullScreen
                ? "fixed inset-0 z-50 w-screen h-screen"
                : "w-full h-[200px]"
                }`}
            >
              <button
                type="button"
                onClick={toggleFullScreen}
                className="absolute top-3 right-3 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900/70 hover:bg-zinc-800 text-white shadow-lg transition-all duration-200"
              >
                {isFullScreen ? <Minimize size={21} /> : <Maximize size={18} />}
              </button>

              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="block w-full h-full object-cover"
              />

              <div
                style={{
                  position: "absolute",
                  bottom: isFullScreen ? "24px" : "8px",
                  right: isFullScreen ? "24px" : "8px",
                  width: isFullScreen ? "180px" : "120px",
                  height: isFullScreen ? "160px" : "54px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "2px solid #2e2e45",
                  background: "#080810",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  zIndex: 20,
                }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </div>
          )}
          <div style={{ padding: "22px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {/* Hide avatar during active video (video takes its place) */}
            {!(isVideo && isActive) && <PeerAvatar name={peerName} avatar={peerAvatar} size={68} pulse={status === "outgoing" || status === "incoming"} />}

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{peerName}</p>
              {status === "outgoing" && <motion.p animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ fontSize: 12, color: "#a78bfa", fontFamily: "'DM Sans', sans-serif" }}>{isVideo ? "📹" : "📞"} Calling...</motion.p>}
              {status === "incoming" && <motion.p animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ fontSize: 12, color: "#a78bfa", fontFamily: "'DM Sans', sans-serif" }}>Incoming {isVideo ? "video" : "voice"} call...</motion.p>}
              {status === "active" && <p style={{ fontSize: 12, color: "#34d399", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>● {fmt(duration)}</p>}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 4 }}>
              {status === "incoming" && (
                <>
                  <Btn onClick={onReject} bg="#2d1515" border="#4d1f1f" color="#f87171" size={54} label="Decline">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </Btn>
                  <Btn onClick={onAccept} bg="linear-gradient(135deg, #22c55e, #16a34a)" border="#22c55e44" color="white" size={54} label="Accept">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  </Btn>
                </>
              )}
              {status === "outgoing" && (
                <Btn onClick={onEnd} bg="linear-gradient(135deg, #ef4444, #dc2626)" border="#ef444444" color="white" size={54} label="Cancel">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </Btn>
              )}
              {status === "active" && (
                <>
                  <Btn onClick={() => onToggleMic(!micMuted)} bg={micMuted ? "#2d1515" : "#1e1e2e"} border={micMuted ? "#4d1f1f" : "#2e2e45"} color={micMuted ? "#f87171" : "#b0aac4"} size={44} label={micMuted ? "Unmute" : "Mute"}>
                    {micMuted
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>}
                  </Btn>
                  <Btn onClick={onEnd} bg="linear-gradient(135deg, #ef4444, #dc2626)" border="#ef444444" color="white" size={52} label="End">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  </Btn>
                  {isVideo && (
                    <Btn onClick={() => onToggleCam(!cameraOff)} bg={cameraOff ? "#2d1515" : "#1e1e2e"} border={cameraOff ? "#4d1f1f" : "#2e2e45"} color={cameraOff ? "#f87171" : "#b0aac4"} size={44} label={cameraOff ? "Cam On" : "Cam Off"}>
                      {cameraOff
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h2a2 2 0 0 1 2 2v9.34" /></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>}
                    </Btn>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

const CallSummaryToast = ({ summary, onClose }) => {
  if (!summary) return null;
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const isVideo = summary.callType === "video";
  const title = summary.outcome === "missed" ? "Missed Call" : "Call Ended";
  const subtitle = summary.outcome === "missed" ? "No connection was established" : `Total time ${fmt(summary.duration || 0)}`;

  return (
    <AnimatePresence>
      <motion.div
        key={`${summary.peerName}-${summary.endedAt}`}
        initial={{ opacity: 0, y: 18, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        style={{ position: "fixed", top: 22, right: 22, zIndex: 1300, background: "linear-gradient(160deg, #13131a 0%, #1a1a28 100%)", border: "1px solid #2e2e45", borderRadius: 16, padding: "12px 14px", minWidth: 250, boxShadow: "0 20px 50px rgba(0,0,0,0.55)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}>
            {isVideo ? "📹" : "📞"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#e8e4dc", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2 }}>{title}</p>
            <p style={{ fontSize: 11.5, color: "#7b7592", fontFamily: "'DM Sans', sans-serif", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {summary.peerName} • {subtitle}
            </p>
          </div>
          <motion.button onClick={onClose} whileHover={{ scale: 1.08, backgroundColor: "#2a2a3a" }} whileTap={{ scale: 0.92 }} style={{ width: 24, height: 24, borderRadius: 8, border: "none", background: "#1e1e2e", color: "#a9a3bf", cursor: "pointer", flexShrink: 0 }}>
            ✕
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── ChatSpace ─────────────────────────────────────────────────────────────────

export default function ChatSpace({ room }) {
  const [editOpen, setEditOpen] = useState(false);
  const { user } = useAuth();
  const { setMessages } = useMessageRes();
  const { setROOMS } = useChatRes();
  const callContainerRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [callState, setCallState] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [callSummary, setCallSummary] = useState(null);
  const durationRef = useRef(0);
  const roomRef = useRef(room);
  const userRef = useRef(user);


  // Always use ref to read callState inside async socket callbacks
  // (useState closures go stale inside useEffect with [] deps)
  const callStateRef = useRef(null);
  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { roomRef.current = room; }, [room]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Media element refs — attached to <audio>/<video> inside CallOverlay
  const remoteAudioRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const ringAudioRef = useRef(null);
  const ringControllerRef = useRef({ stop: null });
  const summaryTimerRef = useRef(null);

  const fmtDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const addCallLog = ({ peerName, callType, seconds, outcome, roomId }) => {
    const targetRoomId = roomId || roomRef.current?.id;
    if (!targetRoomId) return;
    const summaryText = outcome === "completed"
      ? `${callType === "video" ? "Video" : "Voice"} call with ${peerName || "Unknown"} ended (${fmtDuration(seconds)})`
      : `${callType === "video" ? "Video" : "Voice"} call with ${peerName || "Unknown"} was missed`;

    const callLogMessage = {
      _id: `call-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "call-log",
      callType,
      content: summaryText,
      createdAt: new Date().toISOString(),
      room: targetRoomId,
      sender: {
        _id: userRef.current?._id || "system",
        username: userRef.current?.username || "System",
        avatarUrl: userRef.current?.avatarUrl || "",
      },
    };

    setMessages((prev) => [...prev, callLogMessage]);
    setROOMS((prev) => prev.map((r) => (
      r.id === targetRoomId
        ? { ...r, lastMessage: summaryText, time: "just now" }
        : r
    )));
  };

  const toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      await callContainerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  // Called when remote track arrives — keep one persistent remote stream.
  // Replacing srcObject repeatedly can cut audio in some browsers.
  const handleRemoteStream = (stream, track) => {
    const remoteStream = remoteStreamRef.current;
    const tracks = track ? [track] : stream.getTracks();

    tracks.forEach((t) => {
      if (!remoteStream.getTracks().some((existing) => existing.id === t.id)) {
        remoteStream.addTrack(t);
      }
    });

    if (remoteAudioRef.current) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1;
      remoteAudioRef.current.play().catch(() => { });
    }
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  };

  // Timer — only ticks when call is active
  useEffect(() => {
    if (callState?.status !== "active") { setDuration(0); return; }
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [callState?.status]);

  // ── Reset media elements on call end ─────────────────────────────────────
  const resetMedia = () => {
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    remoteStreamRef.current.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current = new MediaStream();
  };

  // ── Wire peerConnection.ontrack after creating it ─────────────────────────
  // We import the module to access the peerConnection variable directly
  // because UseWebRTC.js exposes it as a module-level let
  const wireOnTrack = async () => {
    const mod = await import("../WebRtc/UseWebRTC");
    if (mod.peerConnection) {
      mod.peerConnection.ontrack = (e) => {
        // Some browsers don't reliably populate `event.streams[0]`.
        const stream = (e.streams && e.streams[0]) ? e.streams[0] : new MediaStream([e.track]);
        handleRemoteStream(stream, e.track);
      };
    }
  };

  const stopRinging = () => {
    if (ringAudioRef.current) {
      ringAudioRef.current.pause();
      ringAudioRef.current.src = "";
      ringAudioRef.current = null;
    }
    const c = ringControllerRef.current;
    if (c.stop) c.stop();
    c.stop = null;
  };

  const playBeep = (ctx, frequency = 860, lengthMs = 240, gainValue = 0.05, wave = "triangle") =>
    new Promise((resolve) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      const attack = 0.03;
      const releaseStart = Math.max(0.06, lengthMs / 1000 - 0.08);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(gainValue * 0.8, ctx.currentTime + releaseStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + lengthMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        try { osc.stop(); } catch { /* noop */ }
        resolve();
      }, lengthMs);
    });

  const startToneRinging = (type) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => { });

    let cancelled = false;
    const intervalMs = type === "incoming" ? 1650 : 1450;
    const runPattern = async () => {
      if (cancelled) return;
      if (type === "incoming") {
        await playBeep(audioCtx, 740, 140, 0.03, "sine");
        await new Promise((r) => setTimeout(r, 70));
        await playBeep(audioCtx, 932, 185, 0.036, "sine");
        await new Promise((r) => setTimeout(r, 85));
        await playBeep(audioCtx, 1047, 145, 0.028, "triangle");
      } else {
        await playBeep(audioCtx, 660, 180, 0.028, "sine");
        await new Promise((r) => setTimeout(r, 90));
        await playBeep(audioCtx, 784, 200, 0.03, "triangle");
      }
    };

    runPattern();
    const id = setInterval(runPattern, intervalMs);
    ringControllerRef.current.stop = () => {
      cancelled = true;
      clearInterval(id);
      audioCtx.close().catch(() => { });
    };
  };

  const startRinging = (type) => {
    // Instagram-like soft chime pattern (custom synthesized, no alarm sample).
    stopRinging();
    startToneRinging(type);
  };

  // Attach local preview once the overlay has mounted.
  useEffect(() => {
    if (callState?.status !== "active") return;
    if (callState?.callType !== "video") return;
    let cancelled = false;
    let attempts = 0;

    const tryAttach = () => {
      if (cancelled) return;
      attempts += 1;
      import("../WebRtc/UseWebRTC").then((mod) => {
        if (cancelled) return;
        if (mod.localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = mod.localStream;
          return;
        }
        if (attempts < 10) setTimeout(tryAttach, 150);
      });
    };

    tryAttach();
    return () => { cancelled = true; };
  }, [callState?.status, callState?.callType]);

  useEffect(() => {
    const status = callState?.status;
    if (status === "incoming" || status === "outgoing") {
      startRinging(status);
      return () => stopRinging();
    }
    stopRinging();
    return undefined;
  }, [callState?.status]);

  useEffect(() => {
    if (!callSummary) return;
    if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    summaryTimerRef.current = setTimeout(() => setCallSummary(null), 4500);
    return () => {
      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    };
  }, [callSummary]);

  useEffect(() => () => {
    stopRinging();
    if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
  }, []);

  // Keep remote audio alive in browsers that occasionally pause hidden audio elements.
  useEffect(() => {
    if (callState?.status !== "active") return undefined;
    const el = remoteAudioRef.current;
    if (el) {
      const tryPlay = () => {
        if (callStateRef.current?.status === "active" && el.srcObject) {
          el.play().catch(() => { });
        }
      };
      el.onloadedmetadata = tryPlay;
      el.oncanplay = tryPlay;
      el.onpause = () => {
        // Some browsers unexpectedly pause background/hidden media.
        tryPlay();
      };
    }

    const id = setInterval(() => {
      const audioEl = remoteAudioRef.current;
      if (!audioEl || !audioEl.srcObject) return;
      if (audioEl.paused) audioEl.play().catch(() => { });
    }, 1200);
    return () => {
      clearInterval(id);
      const audioEl = remoteAudioRef.current;
      if (audioEl) {
        audioEl.onloadedmetadata = null;
        audioEl.oncanplay = null;
        audioEl.onpause = null;
      }
    };
  }, [callState?.status, callState?.callType]);

  // ── Caller: initiate call ─────────────────────────────────────────────────
  const handleStartCall = (callType) => {
    if (!room || room.type !== "dm") return;
    const peerId = room.otherUser?.id;
    const peerName = room.otherUser?.name;
    const peerAvatar = room.otherUser?.avatar;
    setCallState({ status: "outgoing", callType, peerId, peerName, peerAvatar, roomId: room.id });
    socket.emit("call:initiate", { to: peerId, roomId: room.id, callType });
  };

  // ── Callee: accept call ───────────────────────────────────────────────────
  // Order matters:
  // 1. getUserMedia  — get mic/camera
  // 2. createPC      — create RTCPeerConnection
  // 3. addTracks     — attach local stream to PC
  // 4. wireOnTrack   — listen for remote stream
  // 5. listenICE     — start sending ICE candidates
  // 6. wait for call:offer from caller (handled in socket listener below)
  const handleAccept = async () => {
    const cs = callStateRef.current;
    if (!cs) return;
    try {
      setCallState((prev) => ({ ...prev, status: "active" }));
      await getUserMedia(cs.callType);

      createPeerConnection();
      addTrackToPeerConnection();
      await wireOnTrack();
      listenForIceCandidates(cs.peerId);

      // Only signal acceptance after mic/cam + tracks are ready.
      socket.emit("call:accept", { to: cs.peerId, roomId: cs.roomId });

      // Local preview: refs may not be ready immediately; the `useEffect` above covers it.
      const mod = await import("../WebRtc/UseWebRTC");
      if (mod.localStream && localVideoRef.current) localVideoRef.current.srcObject = mod.localStream;
      // Note: we do NOT create offer here. Caller creates offer after they
      // receive call:accepted. We just wait for call:offer to arrive.
    } catch (error) {
      console.error("Accept call failed:", error);
      cleanUp();
      resetMedia();
      setCallState(null);
    }
  };

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = () => {
    const cs = callStateRef.current;
    if (!cs) return;
    addCallLog({ peerName: cs.peerName, callType: cs.callType, seconds: 0, outcome: "missed", roomId: cs.roomId });
    socket.emit("call:reject", { to: cs.peerId, roomId: cs.roomId });
    cleanUp();
    resetMedia();
    setCallState(null);
  };

  // ── End / Cancel ──────────────────────────────────────────────────────────
  const handleEnd = () => {
    const cs = callStateRef.current;
    if (!cs) return;
    const endedDuration = durationRef.current;
    const outcome = endedDuration > 0 ? "completed" : "missed";
    addCallLog({ peerName: cs.peerName, callType: cs.callType, seconds: endedDuration, outcome, roomId: cs.roomId });
    const endedSummary = {
      peerName: cs.peerName || "Unknown",
      callType: cs.callType || "audio",
      duration: endedDuration,
      outcome,
      endedAt: Date.now(),
    };
    socket.emit("call:end", { to: cs.peerId, roomId: cs.roomId });
    cleanUp();
    resetMedia();
    setCallState(null);
    setMicMuted(false);
    setCameraOff(false);
    setDuration(0);
    setCallSummary(endedSummary);
  };

  // ── Mute toggle ───────────────────────────────────────────────────────────
  const handleToggleMic = (muted) => {
    setMicMuted(muted);
    // Disable/enable the local audio track so the other person can't hear us
    import("../WebRtc/UseWebRTC").then((mod) => {
      if (mod.localStream) {
        mod.localStream.getAudioTracks().forEach((t) => { t.enabled = !muted; });
      }
      if (mod.peerConnection) {
        mod.peerConnection.getSenders()
          .filter((sender) => sender.track && sender.track.kind === "audio")
          .forEach((sender) => { sender.track.enabled = !muted; });
      }
    });
  };

  // ── Camera toggle ─────────────────────────────────────────────────────────
  const handleToggleCam = (off) => {
    setCameraOff(off);
    import("../WebRtc/UseWebRTC").then((mod) => {
      if (mod.localStream) {
        mod.localStream.getVideoTracks().forEach((t) => { t.enabled = !off; });
      }
    });
  };

  // ── Socket listeners ──────────────────────────────────────────────────────
  // Registered ONCE with empty deps.
  // Always read latest state via callStateRef.current — never stale.
  useEffect(() => {

    // Someone is calling us
    socket.on("call:incoming", ({ from, roomId, callType, callerName, callerAvatar }) => {
      if (callStateRef.current) {
        // Already in a call — auto reject
        socket.emit("call:reject", { to: from, roomId });
        return;
      }
      setCallState({ status: "incoming", callType, peerId: from, peerName: callerName, peerAvatar: callerAvatar, roomId });
    });

    // Our call was accepted — we are the CALLER, now set up WebRTC and send offer
    socket.on("call:accepted", async ({ from }) => {
      try {
        setCallState((prev) => prev ? { ...prev, status: "active" } : prev);
        const cs = callStateRef.current;
        if (!cs) return;

        await getUserMedia(cs.callType);

        // Show our own video
        const mod = await import("../WebRtc/UseWebRTC");
        if (mod.localStream && localVideoRef.current) localVideoRef.current.srcObject = mod.localStream;

        createPeerConnection();
        addTrackToPeerConnection();
        await wireOnTrack();
        listenForIceCandidates(from || cs.peerId);

        // Create and send offer to callee
        const offer = await createOffer();
        socket.emit("call:offer", { to: from || cs.peerId, offer });
      } catch (error) {
        console.error("Call setup failed after accept:", error);
        cleanUp();
        resetMedia();
        setCallState(null);
      }
    });

    // We (callee) received the offer — set remote desc, create answer
    socket.on("call:offer", async ({ from, offer }) => {
      try {
        const mod = await import("../WebRtc/UseWebRTC");
        if (!mod.peerConnection) {
          createPeerConnection();
          addTrackToPeerConnection();
          listenForIceCandidates(from);
        }

        await setRemoteDescription(offer);

        // Wire ontrack AFTER setRemoteDescription so we catch all tracks
        await wireOnTrack();

        const answer = await createAnswer();
        socket.emit("call:answer", { to: from, answer });
      } catch (error) {
        console.error("Handling offer failed:", error);
      }
    });

    // We (caller) received the answer — finalize connection
    socket.on("call:answer", async ({ answer }) => {
      try {
        await setRemoteDescription(answer);
      } catch (error) {
        console.error("Handling answer failed:", error);
      }
    });

    // ICE candidate from the other side — add it to our PC
    socket.on("call:ice", async ({ candidate }) => {
      if (candidate) {
        await addIceCandidate(candidate);
      }
    });

    // They rejected our call
    socket.on("call:rejected", () => {
      const cs = callStateRef.current;
      addCallLog({ peerName: cs?.peerName, callType: cs?.callType || "audio", seconds: 0, outcome: "missed", roomId: cs?.roomId });
      setCallSummary({
        peerName: cs?.peerName || "Unknown",
        callType: cs?.callType || "audio",
        duration: 0,
        outcome: "missed",
        endedAt: Date.now(),
      });
      cleanUp();
      resetMedia();
      setCallState(null);
    });

    // They ended the call
    socket.on("call:ended", () => {
      const cs = callStateRef.current;
      addCallLog({
        peerName: cs?.peerName,
        callType: cs?.callType || "audio",
        seconds: durationRef.current,
        outcome: durationRef.current > 0 ? "completed" : "missed",
        roomId: cs?.roomId,
      });
      setCallSummary({
        peerName: cs?.peerName || "Unknown",
        callType: cs?.callType || "audio",
        duration: durationRef.current,
        outcome: durationRef.current > 0 ? "completed" : "missed",
        endedAt: Date.now(),
      });
      cleanUp();
      resetMedia();
      setCallState(null);
      setMicMuted(false);
      setCameraOff(false);
      setDuration(0);
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:accepted");
      socket.off("call:offer");
      socket.off("call:answer");
      socket.off("call:ice");
      socket.off("call:rejected");
      socket.off("call:ended");
    };
  }, []); // empty deps — intentional, we use refs for state

  if (!room) return (
    <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", background: "#0d0d0f" }}>
      <EmptyState />
    </div>
  );

  return (
    <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", background: "#0d0d0f" }}>
      <AnimatePresence mode="wait">
        <ChatHeader key={room.id} room={room} onOpenEdit={() => { if (room.type === "group") setEditOpen(true); }} callState={callState} onStartCall={handleStartCall} />
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <MessageArea key={room.id} room={room} />
      </AnimatePresence>

      <InputPlaceholder room={room} />

      {editOpen && room.type === "group" && <EditGroupModal room={room} onClose={() => setEditOpen(false)} />}

      <CallOverlay
        callState={callState}
        onAccept={handleAccept}
        onReject={handleReject}
        onEnd={handleEnd}
        onToggleMic={handleToggleMic}
        onToggleCam={handleToggleCam}
        micMuted={micMuted}
        cameraOff={cameraOff}
        duration={duration}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        callContainerRef={callContainerRef}
        remoteAudioRef={remoteAudioRef}
        toggleFullScreen={toggleFullScreen}
        remoteVideoRef={remoteVideoRef}
        localVideoRef={localVideoRef}
      />
      <CallSummaryToast summary={callSummary} onClose={() => setCallSummary(null)} />
    </div>
  );
}