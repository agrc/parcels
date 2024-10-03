import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./App";
import "./styles/basic.scss";
import "./styles/index.css";
import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
