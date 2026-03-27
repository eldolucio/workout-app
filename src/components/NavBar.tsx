"use client";

import { Home, ClipboardList, History, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const styles = {
  nav: {
    position: "fixed" as const,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "72px",
    background: "#0a0a0a",
    borderTop: "1px solid #222",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    padding: "0.5rem 1rem",
    zIndex: 900,
    paddingBottom: "env(safe-area-inset-bottom)",
  },
  item: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "4px",
    textDecoration: "none",
    transition: "color 0.2s ease",
  },
  label: {
    fontFamily: "Barlow Condensed",
    fontSize: "0.625rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
};

const items = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/fichas", icon: ClipboardList, label: "Fichas" },
  { href: "/historico", icon: History, label: "Histórico" },
  { href: "/perfil", icon: User, label: "Perfil" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav style={styles.nav}>
      {items.map((item) => {
        const isActive = pathname === item.href;
        const color = isActive ? "#c8f135" : "#555";
        return (
          <Link key={item.href} href={item.href} style={{ ...styles.item, color }}>
            <item.icon size={22} />
            <span style={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
