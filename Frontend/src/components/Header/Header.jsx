import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { FiMenu, FiX, FiLogOut, FiHome, FiBell, FiUser } from "react-icons/fi";
import Swal from "sweetalert2";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user, inviteCount, refreshInvitations } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, logout!",
      cancelButtonText: "No, cancel",
      reverseButtons: true,
      focusConfirm: false,
    });

    if (result.isConfirmed) {
      logout();
      navigate("/login");
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-primary-600">
                TeamBoard
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 flex items-center gap-2"
            >
              <FiHome className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/invitations"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 flex items-center gap-2 relative"
              onClick={refreshInvitations}
            >
              <FiBell className="h-4 w-4" />
              Invitations
              {inviteCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[1.5rem] px-2 py-0.5 text-xs font-semibold text-white bg-primary-600 rounded-full">
                  {inviteCount > 99 ? "99+" : inviteCount}
                </span>
              )}
            </Link>
            
            {/* <button
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 
    hover:text-primary-600 hover:bg-gray-100 flex items-center gap-2"
            >
              <FiUser className="h-4 w-4" />
              Profile
            </button> */}
            {user && (
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <FiLogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiHome className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/invitations"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                refreshInvitations();
                setMobileMenuOpen(false);
              }}
            >
              <FiBell className="h-4 w-4" />
              Invitations
              {inviteCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[1.5rem] px-2 py-0.5 text-xs font-semibold text-white bg-primary-600 rounded-full">
                  {inviteCount > 99 ? "99+" : inviteCount}
                </span>
              )}
            </Link>
            

            {user && (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <FiLogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
