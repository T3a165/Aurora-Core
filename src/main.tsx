import React from "react";
import ReactDOM from "react-dom/client";
import Jarvis from "./Jarvis";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Jarvis />
    </React.StrictMode>
  );
}

