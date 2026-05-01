import { useContext } from "react";
import { AuthContext, AuthProvider } from "./AuthContext";

export const useAuth=()=>{
    return useContext(AuthContext);
}
