import { SignupForm } from "@/components/signup-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

function Signup() {
  return (
    <div className="flex w-80 flex-col items-center gap-3 p-4">
      <Link to={"/"}>
        <Button className="fixed top-2 left-2 z-10 shadow" variant={"default"}>
          <ArrowLeft />
          Back
        </Button>
      </Link>
      <div className="w-full">
        <SignupForm />
      </div>
    </div>
  );
}

export default Signup;
