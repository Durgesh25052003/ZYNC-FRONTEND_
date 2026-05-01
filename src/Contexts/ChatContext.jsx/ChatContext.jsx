import { createContext, useEffect, useState } from "react";
import { getRoom, getRooms } from "../../Services/service";
import { shapeRoom } from "../../utils/ShapeRoom";
import { useAuth } from "../AuthHook";
import { socket } from "../../Socket/socket";
import { useFormStatus } from "react-dom";

// eslint-disable-next-line react-refresh/only-export-components
export const ChatResContext = createContext();

export const ChatResProvider = ({ children }) => {

    const { user, loading } = useAuth();
    const [loadind, setLoading] = useState(true);
    const [ROOMS, setROOMS] = useState([]);
    const [ActiveRoom, setActiveRoom] = useState(null);

    const fetchRooms = async () => {
        try {
            const res = await getRooms();
            const shaped = res.data.roomsMod.map((room) => shapeRoom(room));
            setROOMS(shaped);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const fetchActiveRoom = async (roomId) => {
        try {
            const res = await getRoom(roomId);
            const shaped = shapeRoom(res.data.room);
            setActiveRoom(shaped);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        const onConnect = () => {

            socket.on("user_online", ({ userId }) => {
                console.log("user_online received", userId);
                setROOMS(prev => prev.map(room => {
                    if (room.type === "dm" && room.otherUser?.id === userId) {
                        return { ...room, otherUser: { ...room.otherUser, online: true } };
                    }
                    if (room.type === "group" && Array.isArray(room.members)) {
                        let changed = false;
                        const members = room.members.map(m => {
                            if (m && (m._id === userId || m.id === userId)) {
                                changed = true;
                                return { ...m, online: true };
                            }
                            return m;
                        });
                        if (changed) return { ...room, members };
                    }
                    return room;
                }));
            });

            socket.on("user_offline", ({ userId }) => {
                console.log("user_offline received", userId);
                setROOMS(prev => prev.map(room => {
                    if (room.type === "dm" && room.otherUser?.id === userId) {
                        return { ...room, otherUser: { ...room.otherUser, online: false } };
                    }
                    if (room.type === "group" && Array.isArray(room.members)) {
                        let changed = false;
                        const members = room.members.map(m => {
                            if (m && (m._id === userId || m.id === userId)) {
                                changed = true;
                                return { ...m, online: false };
                            }
                            return m;
                        });
                        if (changed) return { ...room, members };
                    }
                    return room;
                }));
            });
        };

        if (socket.connected) {
            onConnect(); // already connected
        } else {
            socket.on("connect", onConnect); // wait for connection
        }
        return () => {
            socket.off("connect", onConnect);
            socket.off("online-users");
            socket.off("offline-users");
        }

    }, [])



    useEffect(() => {
        if (loading) return
        if (!user) {
            return;
        }
        else {
            fetchRooms();
        }
    }, [user, loading])

    useEffect(() => {
        if (!ActiveRoom?.id) return;
        setROOMS((prev) =>
            prev.map((room) =>
                room.id === ActiveRoom.id ? { ...room, unread: 0 } : room
            )
        );
    }, [ActiveRoom?.id]);


    return (
        <ChatResContext.Provider value={{ ROOMS, setROOMS, ActiveRoom, setActiveRoom, fetchActiveRoom }}>
            {children}
        </ChatResContext.Provider>
    )
}
