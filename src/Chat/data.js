export const CURRENT_USER = {
  id: "u1",
  name: "You",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
};

export const ROOMS = [
  {
    id: "r1",
    name: "# general",
    lastMessage: "hey everyone, what's up?",
    time: "2m ago",
    unread: 3,
    online: 12,
    avatar: "G",
    color: "#6366f1",
  },
  {
    id: "r2",
    name: "# design-talk",
    lastMessage: "check out this new Figma plugin",
    time: "15m ago",
    unread: 0,
    online: 5,
    avatar: "D",
    color: "#a855f7",
  },
  {
    id: "r3",
    name: "# engineering",
    lastMessage: "PR #42 is ready for review",
    time: "1h ago",
    unread: 7,
    online: 8,
    avatar: "E",
    color: "#06b6d4",
  },
  {
    id: "r4",
    name: "# random",
    lastMessage: "🐶 look at this doggo!!",
    time: "3h ago",
    unread: 0,
    online: 20,
    avatar: "R",
    color: "#f59e0b",
  },
  {
    id: "r5",
    name: "# announcements",
    lastMessage: "v2.0 drops next Friday 🚀",
    time: "1d ago",
    unread: 1,
    online: 31,
    avatar: "A",
    color: "#22c55e",
  },
  {
    id: "r6",
    name: "# introductions",
    lastMessage: "Hi! I'm new here, excited to join",
    time: "2d ago",
    unread: 0,
    online: 4,
    avatar: "I",
    color: "#ec4899",
  },
];

export const MESSAGES_BY_ROOM = {
  r1: [
    { id: "m1", userId: "u2", name: "Alex", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", text: "hey everyone 👋", time: "10:02 AM" },
    { id: "m2", userId: "u3", name: "Maya", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya", text: "what's everyone working on today?", time: "10:03 AM" },
    { id: "m3", userId: "u1", name: "You", avatar: "", text: "just wrapped up the auth flow for Zync 🔐", time: "10:04 AM" },
    { id: "m4", userId: "u1", name: "You", avatar: "", text: "now moving on to the chat UI", time: "10:04 AM" },
    { id: "m5", userId: "u2", name: "Alex", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", text: "nice! how are you handling real-time?", time: "10:05 AM" },
    { id: "m6", userId: "u3", name: "Maya", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya", text: "socket.io or something else?", time: "10:05 AM" },
    { id: "m7", userId: "u1", name: "You", avatar: "", text: "socket.io — keeping it classic 😄", time: "10:06 AM" },
    { id: "m8", userId: "u4", name: "Jordan", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan", text: "hey everyone, what's up?", time: "10:08 AM" },
    { id: "m9", userId: "u2", name: "Alex", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", text: "just chilling, watching the PR queue pile up lol", time: "10:09 AM" },
    { id: "m10", userId: "u1", name: "You", avatar: "", text: "same energy 😅 feel free to review mine when you get a chance", time: "10:10 AM" },
  ],
  r2: [
    { id: "m1", userId: "u3", name: "Maya", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya", text: "check out this new Figma plugin for design tokens 🎨", time: "9:45 AM" },
    { id: "m2", userId: "u1", name: "You", avatar: "", text: "ooh which one?", time: "9:46 AM" },
    { id: "m3", userId: "u3", name: "Maya", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya", text: "it's called Token Studio, syncs directly to your codebase", time: "9:47 AM" },
  ],
  r3: [
    { id: "m1", userId: "u4", name: "Jordan", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan", text: "PR #42 is ready for review 👀", time: "8:30 AM" },
    { id: "m2", userId: "u1", name: "You", avatar: "", text: "on it, give me 20 mins", time: "8:35 AM" },
    { id: "m3", userId: "u4", name: "Jordan", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan", text: "no rush, thanks!", time: "8:36 AM" },
  ],
  r4: [
    { id: "m1", userId: "u2", name: "Alex", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", text: "🐶 look at this doggo!!", time: "7:00 AM" },
    { id: "m2", userId: "u1", name: "You", avatar: "", text: "ADORABLE 😍😍", time: "7:02 AM" },
  ],
  r5: [
    { id: "m1", userId: "u5", name: "Admin", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin", text: "v2.0 drops next Friday 🚀 stay tuned for the changelog!", time: "Yesterday" },
  ],
  r6: [
    { id: "m1", userId: "u6", name: "Sam", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam", text: "Hi! I'm new here, excited to join the community 👋", time: "2d ago" },
    { id: "m2", userId: "u1", name: "You", avatar: "", text: "Welcome Sam! Glad to have you 🎉", time: "2d ago" },
  ],
};
