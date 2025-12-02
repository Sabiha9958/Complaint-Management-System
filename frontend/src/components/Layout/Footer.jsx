/**
 * ================================================================
 * 🦶 FOOTER COMPONENT
 * ================================================================
 * Site-wide footer with:
 * - Company information
 * - Quick navigation links
 * - Contact details
 * - Social media links
 * - Newsletter subscription
 * - Accessibility features
 * ================================================================
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiFileText,
  FiGithub,
  FiTwitter,
  FiLinkedin,
  FiInstagram,
  FiExternalLink,
  FiHeart,
} from "react-icons/fi";

// ================================================================
// 📋 CONFIGURATION
// ================================================================

const COMPANY_INFO = {
  name: "ComplaintMS",
  tagline: "Efficient Complaint Management for Educational Institutions",
  description:
    "A comprehensive complaint management system designed to streamline student grievance handling and resolution processes.",
  email: "support@complaintms.edu",
  phone: "+91 1234567890",
  address: "123 College Campus, Education City, State 560001",
  established: "2024",
};

const QUICK_LINKS = [
  { path: "/", label: "Home", icon: FiFileText },
  { path: "/submit-complaint", label: "Submit Complaint", icon: FiFileText },
  { path: "/my-complaints", label: "My Complaints", icon: FiFileText },
  { path: "/about", label: "About Us", icon: FiFileText },
  { path: "/faq", label: "FAQ", icon: FiFileText },
];

const LEGAL_LINKS = [
  { path: "/privacy-policy", label: "Privacy Policy" },
  { path: "/terms-of-service", label: "Terms of Service" },
  { path: "/cookie-policy", label: "Cookie Policy" },
  { path: "/accessibility", label: "Accessibility" },
];

const SOCIAL_LINKS = [
  {
    name: "GitHub",
    url: "https://github.com/complaintms",
    icon: FiGithub,
    color: "hover:text-gray-400",
  },
  {
    name: "Twitter",
    url: "https://twitter.com/complaintms",
    icon: FiTwitter,
    color: "hover:text-blue-400",
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/company/complaintms",
    icon: FiLinkedin,
    color: "hover:text-blue-500",
  },
  {
    name: "Instagram",
    url: "https://instagram.com/complaintms",
    icon: FiInstagram,
    color: "hover:text-pink-500",
  },
];

const HOURS = {
  support: "24/7 Support Available",
  responseTime: "Response within 24-48 hours",
  office: "Mon-Fri: 9:00 AM - 6:00 PM",
};

// ================================================================
// 🎨 SUB-COMPONENTS
// ================================================================

/**
 * Footer Section Component
 */
const FooterSection = ({ title, children, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    <h3 className="text-lg font-black text-white tracking-tight">{title}</h3>
    {children}
  </div>
);

/**
 * Contact Item Component
 */
const ContactItem = ({ icon: Icon, label, href, external }) => (
  <li className="group">
    <a
      href={href}
      className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-all duration-200"
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-blue-600 transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="font-medium">{label}</span>
      {external && <FiExternalLink className="w-3 h-3 opacity-50" />}
    </a>
  </li>
);

/**
 * Social Media Links Component
 */
const SocialMediaLinks = () => (
  <div className="flex items-center gap-3">
    {SOCIAL_LINKS.map((social) => {
      const Icon = social.icon;
      return (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-3 bg-gray-800 rounded-xl text-gray-400 ${social.color} transition-all duration-200 hover:scale-110 hover:shadow-lg`}
          aria-label={social.name}
        >
          <Icon className="w-5 h-5" />
        </a>
      );
    })}
  </div>
);

/**
 * Newsletter Subscription Component (Optional)
 */
const NewsletterSubscription = () => (
  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
    <h4 className="text-lg font-bold text-white mb-2">Stay Updated</h4>
    <p className="text-sm text-gray-400 mb-4">
      Subscribe to get updates on complaint resolutions and system improvements.
    </p>
    <form className="flex gap-2">
      <input
        type="email"
        placeholder="Enter your email"
        className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        aria-label="Email for newsletter"
      />
      <button
        type="submit"
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
      >
        Subscribe
      </button>
    </form>
  </div>
);

// ================================================================
// 🚀 MAIN COMPONENT
// ================================================================

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-gray-900 text-gray-300 mt-auto border-t border-gray-800"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ============================================ */}
        {/* MAIN FOOTER CONTENT */}
        {/* ============================================ */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* ============================================ */}
            {/* COLUMN 1: About / Company Info */}
            {/* ============================================ */}
            <FooterSection title={COMPANY_INFO.name} className="lg:col-span-1">
              <p className="text-sm text-gray-400 leading-relaxed">
                {COMPANY_INFO.description}
              </p>
              <div className="pt-4">
                <SocialMediaLinks />
              </div>
            </FooterSection>

            {/* ============================================ */}
            {/* COLUMN 2: Quick Links */}
            {/* ============================================ */}
            <FooterSection title="Quick Links">
              <nav>
                <ul className="space-y-3">
                  {QUICK_LINKS.map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 bg-blue-500 rounded-full group-hover:w-2 transition-all" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </FooterSection>

            {/* ============================================ */}
            {/* COLUMN 3: Contact */}
            {/* ============================================ */}
            <FooterSection title="Contact Us">
              <ul className="space-y-3">
                <ContactItem
                  icon={FiMail}
                  label={COMPANY_INFO.email}
                  href={`mailto:${COMPANY_INFO.email}`}
                />
                <ContactItem
                  icon={FiPhone}
                  label={COMPANY_INFO.phone}
                  href={`tel:${COMPANY_INFO.phone}`}
                />
                <ContactItem
                  icon={FiMapPin}
                  label={COMPANY_INFO.address}
                  href="#"
                />
              </ul>
            </FooterSection>

            {/* ============================================ */}
            {/* COLUMN 4: Hours & Info */}
            {/* ============================================ */}
            <FooterSection title="Support Hours">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <FiClock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {HOURS.support}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {HOURS.responseTime}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                  <p className="text-xs text-gray-400">{HOURS.office}</p>
                </div>
              </div>
            </FooterSection>
          </div>

          {/* ============================================ */}
          {/* NEWSLETTER (Optional) */}
          {/* ============================================ */}
          {/* <div className="mt-12">
            <NewsletterSubscription />
          </div> */}
        </div>

        {/* ============================================ */}
        {/* FOOTER BOTTOM */}
        {/* ============================================ */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <p>
                &copy; {COMPANY_INFO.established}-{currentYear}{" "}
                <span className="font-bold text-white">
                  {COMPANY_INFO.name}
                </span>
                . All rights reserved.
              </p>
            </div>

            {/* Legal Links */}
            <nav className="flex flex-wrap items-center justify-center gap-6">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Made with Love */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Made with</span>
              <FiHeart className="w-3 h-3 text-red-500 animate-pulse" />
              <span>by ComplaintMS Team</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

/**
 * ================================================================
 * 📖 USAGE EXAMPLE
 * ================================================================
 *
 * import Footer from './components/Footer';
 *
 * const App = () => (
 *   <div className="min-h-screen flex flex-col">
 *     <Header />
 *     <main className="flex-1">
 *       {children}
 *     </main>
 *     <Footer />
 *   </div>
 * );
 * ================================================================
 */
