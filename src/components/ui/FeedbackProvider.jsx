"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Icon from "./Icon";
const FeedbackContext = createContext(() => {});
export const useFeedback = () => useContext(FeedbackContext);
export default function FeedbackProvider({children}) {
  const [message,setMessage] = useState("");
  const timer = useRef();
  const notify = useCallback(text => {
    clearTimeout(timer.current); setMessage(text);
    timer.current = setTimeout(() => setMessage(""),4000);
  },[]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  return <FeedbackContext.Provider value={notify}>{children}<div className="toast-region" role="status" aria-live="polite" aria-atomic="true">{message && <div key={message} className="feedback-toast"><Icon name="check" size={17}/><span>{message}</span><button className="icon-button" onClick={()=>setMessage("")} aria-label="Dismiss notification"><Icon name="close" size={14}/></button></div>}</div></FeedbackContext.Provider>;
}
