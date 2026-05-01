import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import RoomList from "./RoomList";
import ChatSpace from "./ChatSpace";
import useChatRes from "../Contexts/ChatContext.jsx/ChatHook";
import { useAuth } from "../Contexts/AuthHook";

export default function ChatLayout() {
  const { ROOMS , ActiveRoom , setActiveRoom} = useChatRes();
  const {user,loading}=useAuth();
 

  useEffect(() => {
  if (ROOMS.length > 0 && !ActiveRoom) {
    setActiveRoom(ROOMS[0]); // default to first room
  }
}, [ROOMS])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0d0f; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #252535; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #2e2e45; }
      `}</style>

      <div className="flex h-screen w-screen overflow-hidden bg-[#0d0d0f]">

        <motion.div
          className="w-1/4 min-w-[240px] max-w-[300px] h-full flex-shrink-0"
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <RoomList
            rooms={ROOMS}
            activeRoomId={ActiveRoom?.id}
            onSelectRoom={setActiveRoom}
            currentUser={user}
          />
        </motion.div>

        <motion.div
          className="flex-1 h-full min-w-0"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <ChatSpace room={ActiveRoom} onSelectRoom={setActiveRoom} />
        </motion.div>

      </div>
    </>
  );
}