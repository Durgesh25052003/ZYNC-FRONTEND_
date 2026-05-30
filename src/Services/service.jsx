import axios from "axios";
import useChatRes from "../Contexts/ChatContext.jsx/ChatHook";

const userService = new axios.create({
    baseURL: "https://zync-backend-tive.onrender.com/api/v1/user",
    withCredentials: true
})
const roomService = new axios.create({
    baseURL: "https://zync-backend-tive.onrender.com/api/v1/room",
    withCredentials: true
})

const messageService = new axios.create({
    baseURL: "https://zync-backend-tive.onrender.com/api/v1/message",
    withCredentials: true
})
export const login = async (data) => {
    try {
        const res = await userService.post("/login", data);
        return res;
    } catch (err) {
        console.log(err);
    }
}

export const getMe = async () => {
    try {
        const res = await userService.get("/me");
        return res;
    } catch (error) {
        console.log(error);
    }
}

export const logout = async () => {
    try {
        const res = await userService.post("/logout");
        return res;
    } catch (error) {
        console.log(error);
    }
}

export const register = async (data) => {
    try {
        const res = await userService.post("/register", data);
        return res;
    } catch (err) {
        console.log(err);
    }
}

export const getRooms = async () => {
    try {
        const res = await roomService.get("/getRooms");
        return res;
    } catch (error) {
        console.log(error);
    }
};

export const getMessages = async (room, page = 0) => {
    try {
        const res = await messageService.get(`/getMessages/${room.id}/?page=${page}&limit=20`);
        return res;
    } catch (error) {
        console.log(error);
    }
}

export const sendMessage = async (content, room, file) => {
    try {
        if (file) {
            const formData = new FormData();
            if (content) formData.append("content", content);
            formData.append("image", file);
            const res = await messageService.post(`/sendMessage/${room.id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return res;
        } else {
            const res = await messageService.post(`/sendMessage/${room.id}`, { content });
            return res;
        }
    } catch (error) {
        console.log(error);
    }
}

export const createDMRoom = async (userId) => {
    try {
        const res = await roomService.post("/createDMRoom", { userId });
        return res;
    } catch (error) {
        console.log(error);
    }
}

export const createRoom = async (data) => {
    try {
        const res = await roomService.post("/createRoom", data);
        return res;
    }
    catch (error) {
        console.log(error);
    }
}

export const updateRoom = async (roomId, data) => {
    try {
        const res = await roomService.patch(`/updateRoom/${roomId}`, data, data instanceof FormData ? {
            headers: { "Content-Type": "multipart/form-data" }
        } : {});
        return res;
    }
    catch (error) {
        console.log(error);
    }
}

export const leaveRoom = async (roomId) => {
    try {
        const res = await roomService.post(`/leaveRoom/${roomId}`);
        return res;
    }
    catch (error) {
        console.log(error);
    }
}

export const searchUsers = async (query) => {
    try {
        const res = await userService.get(`/getUserByName/${query}`);
        return res;
    }
    catch (error) {
        console.log(error);
    }
}

export const updateProfile = async (data) => {
    try {
        console.log(data)
        const res = await userService.patch("/updateMe", data, data instanceof FormData ? {
            headers: { "Content-Type": "multipart/form-data" }
        } : {});
        return res;
    }
    catch (error) {
        console.log(error);
    }
}

export const getRoom = async (roomId) => {
    try {
        const res = await roomService.get(`/getRoom/${roomId}`);
        return res;
    } catch (error) {
        console.log(error);
    }
}
