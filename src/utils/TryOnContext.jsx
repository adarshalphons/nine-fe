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
      try { wsRef.current.close(); } catch(e){}
    }
    wsRef.current = socket;

    socket.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.status === "done" && msg.garment_id && msg.url) {
          setTryonResults(prev => ({
            ...prev,
            [msg.garment_id]: `${msg.url}?t=${Date.now()}`
          }));
        } else if (msg.status === "error") {
          console.warn("Try-on error:", msg.garment_id, msg.error || msg);
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    });

    socket.addEventListener("close", () => console.log("WS closed"));
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
