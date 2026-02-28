import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import Profile from "./Profile.jsx";
import ForgotPassword from "./ForgotPassword.jsx";
import Settings from "./Settings.jsx";
import Upgrade from "./Upgrade.jsx";
import { HashRouter, Routes, Route } from "react-router";
import "~/assets/tailwind.app.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/upgrade" element={<Upgrade />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
