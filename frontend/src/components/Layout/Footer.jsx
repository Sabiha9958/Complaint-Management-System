import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiGithub,
  FiLinkedin,
  FiTwitter,
  FiInstagram,
  FiArrowUpRight,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const BRAND = {
  name: "ComplaintMS",
  tagline: "Campus grievance support, made simple",
  description:
    "A centralized platform for submitting, routing, and tracking student complaints with clear ownership and updates.",
  email: "help@complaintms.in",
  phone: "+91 80 4123 9876",
  addressLine1: "Innovation Block, 2nd Floor",
  addressLine2: "Bengaluru, Karnataka 560059, India",
  mapsUrl: "https://www.google.com/maps?q=Bengaluru%20Karnataka%20560059",
  established: 2024,
};

const HOURS = [
  { label: "Support", value: "24/7 (Email)" },
  { label: "Office", value: "Mon–Fri, 9:30 AM – 6:30 PM IST" },
  { label: "Typical response", value: "Within 24–48 hours" },
];

const SOCIAL = [
  { name: "GitHub", href: "https://github.com/complaintms", Icon: FiGithub },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/complaintms",
    Icon: FiLinkedin,
  },
  { name: "Twitter", href: "https://twitter.com/complaintms", Icon: FiTwitter },
  {
    name: "Instagram",
    href: "https://instagram.com/complaintms",
    Icon: FiInstagram,
  },
];

const cn = (...c) => c.filter(Boolean).join(" ");

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-extrabold tracking-wide text-zinc-100">
    {children}
  </h3>
);

const FooterSection = ({ title, children, className }) => (
  <section className={cn("space-y-4", className)} aria-label={title}>
    <SectionTitle>{title}</SectionTitle>
    {children}
  </section>
);

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className={cn(
      "group inline-flex items-center gap-2 rounded-lg py-1 text-sm text-zinc-400 transition",
      "hover:text-zinc-100",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
      "motion-reduce:transition-none"
    )}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 transition-all group-hover:w-2.5 group-hover:bg-zinc-300" />
    {children}
  </Link>
);

const ExternalLink = ({ href, ariaLabel, className, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    className={cn(
      "inline-flex items-center gap-2 rounded-lg text-sm text-zinc-400 transition",
      "hover:text-zinc-100",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
      "motion-reduce:transition-none",
      className
    )}
  >
    {children}
    <FiArrowUpRight className="h-4 w-4 opacity-70" />
  </a>
);

const ContactRow = ({ Icon, label, href, isExternal }) => {
  const base = cn(
    "flex items-start gap-3 rounded-xl p-2 -m-2 text-sm text-zinc-400 transition",
    "hover:bg-white/5 hover:text-zinc-100",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
    "motion-reduce:transition-none"
  );

  const content = (
    <>
      <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
        <Icon className="h-4 w-4 text-zinc-200" />
      </span>
      <span className="leading-relaxed">{label}</span>
    </>
  );

  if (!href) return <div className={base}>{content}</div>;

  return (
    <a
      href={href}
      className={base}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {content}
    </a>
  );
};

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });

  const onSubmit = (e) => {
    e.preventDefault();
    const value = email.trim();

    if (!value) {
      setStatus({ type: "error", message: "Please enter an email address." });
      return;
    }

    setStatus({
      type: "success",
      message: "Subscribed. Check your inbox for confirmation.",
    });
    setEmail("");
  };

  const statusClass =
    status.type === "error"
      ? "text-rose-200"
      : status.type === "success"
        ? "text-emerald-200"
        : "text-zinc-400";

  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <p className="text-sm font-extrabold text-zinc-100">Newsletter</p>
      <p className="mt-1 text-sm text-zinc-400">
        Occasional updates on features, SLAs, and service improvements.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <label className="sr-only" htmlFor="footer-newsletter-email">
          Email address
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@college.edu"
          className={cn(
            "h-11 w-full flex-1 rounded-xl bg-zinc-900/60 px-4 text-sm text-zinc-100",
            "ring-1 ring-white/10 outline-none",
            "focus:ring-2 focus:ring-zinc-200/40"
          )}
        />
        <button
          type="submit"
          className={cn(
            "h-11 rounded-xl bg-zinc-100 px-5 text-sm font-extrabold text-zinc-950 transition",
            "hover:bg-white",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
            "motion-reduce:transition-none"
          )}
        >
          Subscribe
        </button>
      </form>

      <p className={cn("mt-3 text-xs", statusClass)} aria-live="polite">
        {status.message}
      </p>
    </div>
  );
};

const BackToTopButton = () => (
  <button
    type="button"
    onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
    className={cn(
      "inline-flex items-center gap-2 rounded-lg text-xs text-zinc-500 transition hover:text-zinc-100",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
      "motion-reduce:transition-none"
    )}
    aria-label="Back to top"
  >
    Back to top <FiArrowUpRight className="h-4 w-4 opacity-70" />
  </button>
);

const Footer = () => {
  const { isAuthenticated, user } = useAuth();
  const year = new Date().getFullYear();

  const quickLinks = useMemo(() => {
    const base = [
      { to: "/help", label: "Getting started" },
      { to: "/faq", label: "FAQ" },
      { to: "/about", label: "About" },
    ];

    const authLinks = [
      { to: "/complaints/new", label: "New complaint" },
      { to: "/complaints/my", label: "My complaints" },
      { to: "/profile", label: "Profile" },
      { to: "/settings", label: "Settings" },
    ];

    const adminLinks = [{ to: "/admin", label: "Management" }];

    const links = [...base, ...(isAuthenticated ? authLinks : [])];

    if (isAuthenticated && (user?.role === "admin" || user?.role === "staff")) {
      links.push(...adminLinks);
    }

    return links;
  }, [isAuthenticated, user?.role]);

  const legalLinks = useMemo(
    () => [
      { to: "/privacy-policy", label: "Privacy policy" },
      { to: "/terms-of-service", label: "Terms" },
      { to: "/cookie-policy", label: "Cookies" },
      { to: "/accessibility", label: "Accessibility" },
    ],
    []
  );

  return (
    <footer
      className="mt-auto border-t border-white/10 bg-zinc-950 text-zinc-200"
      role="contentinfo"
    >
      <div className="bg-gradient-to-b from-white/5 via-transparent to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-4">
              <p className="text-lg font-extrabold tracking-tight text-zinc-100">
                {BRAND.name}
              </p>
              <p className="text-sm font-bold text-zinc-300">{BRAND.tagline}</p>
              <p className="text-sm leading-relaxed text-zinc-400">
                {BRAND.description}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {SOCIAL.map(({ name, href, Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition",
                      "hover:bg-white/10 hover:ring-white/20",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                      "motion-reduce:transition-none"
                    )}
                  >
                    <Icon className="h-5 w-5 text-zinc-200" />
                  </a>
                ))}
              </div>
            </div>

            <FooterSection title="Quick links" className="lg:col-span-3">
              <nav aria-label="Footer quick links" className="space-y-2">
                {quickLinks.map((l) => (
                  <div key={l.to}>
                    <FooterLink to={l.to}>{l.label}</FooterLink>
                  </div>
                ))}
              </nav>

              {!isAuthenticated ? (
                <div className="pt-4 text-xs text-zinc-500">
                  <p className="text-zinc-400">Account</p>
                  <div className="mt-2 space-y-2">
                    <FooterLink to="/login">Log in</FooterLink>
                    <FooterLink to="/register">Register</FooterLink>
                    <FooterLink to="/forgot-password">
                      Forgot password
                    </FooterLink>
                  </div>
                </div>
              ) : null}
            </FooterSection>

            <FooterSection title="Contact" className="lg:col-span-5">
              <address className="not-italic">
                <div className="grid gap-2 sm:grid-cols-2">
                  <ContactRow
                    Icon={FiMail}
                    label={BRAND.email}
                    href={`mailto:${BRAND.email}`}
                  />
                  <ContactRow
                    Icon={FiPhone}
                    label={BRAND.phone}
                    href={`tel:${BRAND.phone}`}
                  />
                  <div className="sm:col-span-2">
                    <ContactRow
                      Icon={FiMapPin}
                      label={`${BRAND.addressLine1}, ${BRAND.addressLine2}`}
                      href={BRAND.mapsUrl}
                      isExternal
                    />
                  </div>
                </div>
              </address>

              <div className="mt-5 grid gap-3 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 sm:grid-cols-2">
                {HOURS.map((h) => (
                  <div key={h.label} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-zinc-900/60 ring-1 ring-white/10">
                      <FiClock className="h-4 w-4 text-zinc-200" />
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-zinc-100">
                        {h.label}
                      </p>
                      <p className="text-xs text-zinc-400">{h.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Newsletter />
              </div>
            </FooterSection>
          </div>

          <div className="mt-12 border-t border-white/10 pt-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-zinc-500">
                © {BRAND.established}–{year}{" "}
                <span className="font-bold text-zinc-100">{BRAND.name}</span>.
                All rights reserved.
              </p>

              <nav
                aria-label="Footer legal links"
                className="flex flex-wrap gap-x-6 gap-y-2"
              >
                {legalLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={cn(
                      "rounded-lg text-xs text-zinc-500 transition hover:text-zinc-100",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                      "motion-reduce:transition-none"
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <ExternalLink
                  href={BRAND.mapsUrl}
                  ariaLabel="Open location in Google Maps (opens in new tab)"
                  className="text-xs text-zinc-500 hover:text-zinc-100"
                >
                  Location
                </ExternalLink>
                <BackToTopButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
