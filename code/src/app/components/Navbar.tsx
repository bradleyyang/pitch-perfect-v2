import React from "react";
import "@/app/styles/navbar.css";
import { ToggleThemeButton } from "./ToggleThemeButton";

interface NavbarProps {
  logo?: string;
  brandName?: string;
  navItems?: Array<{
    label: string;
    onClick: () => void;
  }>;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  logo,
  brandName = "Pitch Perfect",
  navItems = [
    { label: "Home", onClick: () => {} },
    { label: "Learn More", onClick: () => {} },
    { label: "Analyze", onClick: () => {} },
  ],
  onThemeToggle,
  isDarkMode = true,
}) => {
  return (
    <nav className="navbar">
      {/* Brand Section */}
      <div className="navbar-brand">
        {logo && <img src={logo} alt={brandName} className="navbar-logo" />}
        <span className="navbar-title">
          <span className="brand-pitch">P</span>itch{" "}
          <span className="brand-perfect">P</span>erfect
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex space-x-6">
        <div className="navbar-links">
          {navItems.map((item, index) => (
            <button key={index} onClick={item.onClick} className="nav-link">
              {item.label}
            </button>
          ))}
        </div>

        <ToggleThemeButton
          isDarkMode={isDarkMode}
          onThemeToggle={onThemeToggle}
          className={"theme-toggle"}
        />
      </div>
    </nav>
  );
};

export { Navbar };
