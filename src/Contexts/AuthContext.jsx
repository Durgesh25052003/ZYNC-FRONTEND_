import { Children, createContext, useEffect, useState } from "react";
import { getMe } from "../Services/service";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const res = window.localStorage.getItem("user") ? JSON.parse(window.localStorage.getItem("user")) : await getMe();
            setUser(res);
        } catch {
            setUser(null)
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        fetchUser();
    }, [])

    const logout = async () => {
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
