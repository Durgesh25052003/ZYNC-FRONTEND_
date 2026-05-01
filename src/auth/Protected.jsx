import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Contexts/AuthHook";

export const Protected = () => {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                Loading...
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />
}