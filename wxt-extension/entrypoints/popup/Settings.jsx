import App from "../options/App";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { captureEvent } from "@/lib/posthog";

function Settings() {
  useEffect(() => {
    // Simple page-view style event for the settings screen.
    void captureEvent("settings_opened");
  }, []);

  return (
    <>
      <Link to={"/"}>
        <Button className="fixed top-2 left-2 z-10 shadow" variant={"default"}>
          <ArrowLeft />
          Back
        </Button>
      </Link>
      <App />
    </>
  );
}

export default Settings;
