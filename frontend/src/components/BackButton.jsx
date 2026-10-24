
import { useNavigate } from "react-router-dom";
import "./BackButton.css";

function BackButton({ fallback = "/", label = "Go Back" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      className="app-back-button"
      onClick={handleBack}
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}

export default BackButton;
