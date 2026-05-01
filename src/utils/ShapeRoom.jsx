// utils/shapeRoom.js

const ACCENTS = ["#6366f1", "#a855f7", "#06b6d4", "#f59e0b", "#22c55e", "#ec4899"];

function colorFromId(id = "") {
  const code = id.toString().charCodeAt(id.toString().length - 1);
  return ACCENTS[code % ACCENTS.length];
}

export function formatTime(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function shapeRoom(room) {
  const base = {
    id: room.roomId,
    lastMessage: room.lastMessage ?? "No messages yet",
    time: formatTime(room.lastMessageTime),
    unread: 0,
  };

  if (room.isDM) {
    return {
      ...base,
      type: "dm",
      currentUserId: room.currentUserId,
      otherUser: {
        id: room.otherUserId,
        name: room.roomName,
        avatar: room.roomAvatar,
        online: room.isOnline ?? false,
      },
    };
  }

  const rawMembers = Array.isArray(room.roomMembers) ? room.roomMembers : [];

  const members = rawMembers.map((m) => {
    if (!m) return m;
    const id = m._id || m.id || m.userId || m.user || m.memberId;
    const username = m.username || m.name || m.displayName;
    const avatarUrl = m.avatarUrl || m.avatar || m.image || m.photo;
    const online = m.online ?? m.isOnline ?? false;
    return {
      ...m,
      _id: id || m._id,
      id: id || m.id,
      username,
      name: username || m.name,
      avatarUrl,
      online,
    };
  });

  return {
    ...base,
    type: "group",
    currentUserId: room.currentUserId,
    name: room.roomName,
    image: room.roomAvatar,
    members,
    color: colorFromId(room.roomId),
  };
}
