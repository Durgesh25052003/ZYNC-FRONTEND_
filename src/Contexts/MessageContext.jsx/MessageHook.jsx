import React, { useContext } from 'react'
import { MessageContext } from './MessageContext';

export const useMessageRes=()=>{
    return useContext(MessageContext);
}

export default useMessageRes;