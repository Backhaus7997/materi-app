import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";

import Layout from "./Layout.jsx";

import Quotes from "./Quotes";
import QuoteBuilder from "./QuoteBuilder";
import RoleSelection from "./RoleSelection";
import SupplierDashboard from "./SupplierDashboard";
import VendorDashboard from "./VendorDashboard";
import VendorSuppliers from "./VendorSuppliers";
import VendorProducts from "./VendorProducts";
import ProductDetail from "./ProductDetail";
import VendorCart from "./VendorCart";
import LoginPage from "./login";      // página de login
import RegisterPage from "./register"; // página de registro
import ForgotPasswordPage from "./ForgotPassword"; // página de recuperación de contraseña
import ResetPasswordPage from "./ResetPassword"; // página de restablecer contraseña

const PAGES = {
  Quotes,
  QuoteBuilder,
  RoleSelection,
  SupplierDashboard,
  VendorDashboard,
  VendorSuppliers,
  VendorProducts,
  ProductDetail,
  VendorCart,
};

function _getCurrentPage(url) {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || Object.keys(PAGES)[0];
}

function PagesContent() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  // 👇 Auth sin Layout: "/" también muestra el login
  if (path === "/" || path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/forgot-password") || path.startsWith("/reset-password")) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    );
  }

  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        {/* Si alguien entra directo a /Quotes, etc, sigue funcionando */}
        <Route path="/Quotes" element={<Quotes />} />
        <Route path="/QuoteBuilder" element={<QuoteBuilder />} />
        <Route path="/RoleSelection" element={<RoleSelection />} />
        <Route path="/SupplierDashboard" element={<SupplierDashboard />} />
        <Route path="/VendorDashboard" element={<VendorDashboard />} />
        <Route path="/VendorSuppliers" element={<VendorSuppliers />} />
        <Route path="/VendorProducts" element={<VendorProducts />} />
        <Route path="/ProductDetail" element={<ProductDetail />} />
        <Route path="/VendorCart" element={<VendorCart />} />
      </Routes>
    </Layout>
  );
}

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
