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

// 👇 nueva import
import Login from "./login";

import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";

const PAGES = {
  Quotes: Quotes,
  QuoteBuilder: QuoteBuilder,
  RoleSelection: RoleSelection,
  SupplierDashboard: SupplierDashboard,
  VendorDashboard: VendorDashboard,
  VendorSuppliers: VendorSuppliers,
  VendorProducts: VendorProducts,
  ProductDetail: ProductDetail,
  VendorCart: VendorCart,
  // 👇 lo agregamos para que _getCurrentPage lo reconozca
  Login: Login,
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

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        {/* home */}
        <Route path="/" element={<Quotes />} />

        {/* login */}
        <Route path="/login" element={<Login />} />

        {/* resto de las páginas */}
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
