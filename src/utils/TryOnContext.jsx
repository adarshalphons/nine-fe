import React, { createContext, useContext, useState, useRef } from "react";

const TryOnContext = createContext();

export const TryOnProvider = ({ children }) => {
  const [isTryOnMode, setIsTryOnMode] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [tryonResults, setTryonResults] = useState({});
  const wsRef = useRef(null);

  const enableTryOn = (files) => {
    setUploadedPhotos(files);
    setIsTryOnMode(true);
  };

  const disableTryOn = () => {
    setIsTryOnMode(false);
    setUploadedPhotos([]);
    setTryonResults({});
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }
  };

  const attachWebSocket = (socket) => {
    if (wsRef.current) {
      console.log("attachWebSocket called with existing socket - closing old one");
      try { wsRef.current.close(); } catch(e){}
    }
    wsRef.current = socket;

    socket.addEventListener("open", () => console.log("WS opened", new Date().toISOString()));

    socket.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "result" && msg.status === "completed" && msg.result_url) {
          setTryonResults(prev => ({
            ...prev,
            [msg.garment_id]: `${msg.result_url}?t=${Date.now()}`
          }));
        } else if (msg.type === "result" && msg.status === "failed") {
          console.warn("Try-on failed for garment:", msg.garment_id, msg.error || "unknown error");
        } else if (msg.type === "complete") {
          console.log("Try-on session complete. Total:", msg.total);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    });

    socket.addEventListener("close", (e) => {
      if (e.code !== 1000) console.log("WS closed", e.code);
    });
    socket.addEventListener("error", (err) => console.error("WS error", err));
  };

  return (
    <TryOnContext.Provider value={{
      isTryOnMode,
      uploadedPhotos,
      tryonResults,
      setTryonResults,
      enableTryOn,
      disableTryOn,
      attachWebSocket
    }}>
      {children}
    </TryOnContext.Provider>
  );
};

export const useTryOn = () => useContext(TryOnContext);
