import { useContext } from "react"
import { ChatResContext } from "./ChatContext";

const useChatRes=()=>{
     return useContext(ChatResContext);
}
export default useChatRes;

