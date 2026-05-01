import { useEffect, useState } from "react";
import { createContext } from "react";
import { getMessages, sendMessage } from "../../Services/service";
import useChatRes from "../ChatContext.jsx/ChatHook";
import { useAuth } from "../AuthHook";
import { socket } from "../../Socket/socket";
import { formatTime } from "../../utils/ShapeRoom";


export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const { ActiveRoom, loading, setROOMS } = useChatRes();
    const [isTyping, setIsTyping] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { user } = useAuth();

    const getRoomId = (roomValue) => {
        if (!roomValue) return "";
        if (typeof roomValue === "string") return roomValue;
        if (typeof roomValue === "object") return roomValue.id || roomValue._id || "";
        return "";
    };

    const updateRoomPreview = ({ roomId, content, fromOtherUser }) => {
        if (!roomId) return;
        const nowIso = new Date().toISOString();
        setROOMS((prev) => {
            const index = prev.findIndex((r) => r.id === roomId);
            if (index === -1) return prev;
            const room = prev[index];
            const shouldIncrementUnread = fromOtherUser && ActiveRoom?.id !== roomId;
            const updatedRoom = {
                ...room,
                lastMessage: content || "New message",
                time: formatTime(nowIso),
                unread: shouldIncrementUnread ? (room.unread || 0) + 1 : room.unread || 0,
            };
            const next = [...prev];
            next.splice(index, 1);
            next.unshift(updatedRoom);
            return next;
        });
    };


    const fetchMessages = async (room, pageNum = 0) => {
        try {
            const res = await getMessages(room, pageNum);
            const newMessages = res.data.messages;

            if (pageNum === 0) {
                setMessages(newMessages);        // fresh load
            } else {
                setMessages(prev => [...newMessages, ...prev]); // prepend older messages
            }

            if (newMessages.length < 20) setHasMore(false); // no more pages
        } catch (error) {
            console.log(error);
        }
    };

    // load more when scrolled to top
    const loadMore = () => {
        if (!hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchMessages(ActiveRoom, nextPage);
    };

    const sendMessages = async (message, file) => {
        if (!ActiveRoom || (!message && !file)) return;
    
        const tempId = Date.now().toString();
        let imageUrl = null;
        if (file) {
            imageUrl = URL.createObjectURL(file);
        }
    
        const tempMessage = {
            _id: tempId,
            content: message,
            createdAt: new Date(),
            room: ActiveRoom.id,
            sender: {
                _id: user._id,
                username: user.username,
                avatarUrl: user.avatarUrl,
            },
            imageUrl,
            isSent: false, // for optimistic UI
        };
    
        setMessages(prev => [...prev, tempMessage]);
    
        try {
            if (file) {
                const res = await sendMessage(message, ActiveRoom, file);
                const sentMessage = res.data.message;
    
                setMessages(prev =>
                    prev.map(m => (m._id === tempId ? { ...m, ...sentMessage, isSent: true } : m))
                );
                updateRoomPreview({
                    roomId: ActiveRoom.id,
                    content: sentMessage?.content || (sentMessage?.imageUrl ? "Image" : "New message"),
                    fromOtherUser: false,
                });
            } else {
                socket.emit("send-message", {
                    content: message,
                    roomId: ActiveRoom.id,
                    tempId: tempId, // pass temp id to server
                });
                updateRoomPreview({ roomId: ActiveRoom.id, content: message, fromOtherUser: false });
            }
        } catch (error) {
            console.log(error);
            // revert on error
            setMessages(prev => prev.filter(m => m._id !== tempId));
        }
    };

    useEffect(() => {
        if (!ActiveRoom) return;
        if (loading) return;
        setPage(0);
        setHasMore(true);
        fetchMessages(ActiveRoom, 0);
    }, [ActiveRoom, loading]);

    useEffect(() => {
        if (!user) return;
    
        const handleReceiveMessage = (message) => {
            const messageRoomId = getRoomId(message.room);
            const previewContent = message.content || (message.imageUrl || message.image ? "Image" : "New message");

            // It's a confirmation of a message sent from this client
            if (message.tempId && message.sender._id === user._id) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m._id === message.tempId ? { ...message, isSent: true } : m
                    )
                );
                updateRoomPreview({ roomId: messageRoomId, content: previewContent, fromOtherUser: false });
            }
            // It's a new message from another user
            else if (message.sender._id !== user._id) {
                if (ActiveRoom?.id === messageRoomId) {
                    setMessages((prev) => [...prev, message]);
                }
                updateRoomPreview({ roomId: messageRoomId, content: previewContent, fromOtherUser: true });
            } else {
                updateRoomPreview({ roomId: messageRoomId, content: previewContent, fromOtherUser: false });
            }
        };
    
        socket.on("receive-message", handleReceiveMessage);
    
        return () => {
            socket.off("receive-message", handleReceiveMessage);
        };
    }, [user, ActiveRoom?.id]);


    useEffect(() => {
        console.log("useEffect called")
        if (!user) return;
        socket.on("start-typing", ({ userId }) => {
            console.log("start-typing received", userId, user._id)
            if (userId !== user._id) setIsTyping(true);
        });

        socket.on("stop-typing", ({ userId }) => {
            if (userId !== user._id) setIsTyping(false);
        });

        return () => {
            socket.off("start-typing");
            socket.off("stop-typing");
        };
    }, [user?._id]);


    return (
        <MessageContext.Provider value={{ messages, setMessages, sendMessages, isTyping, setIsTyping, loadMore }}>
            {children}
        </MessageContext.Provider>
    )
}
