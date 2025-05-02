"use client";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface ActiveLinkProps extends LinkProps {
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

export default function ActiveLink({
  href,
  className = "",
  activeClassName = "bg-lime-900 text-white",
  children,
  ...props
}: ActiveLinkProps) {
  const pathname = usePathname();
  const isActive =
    typeof href === "string"
      ? (href === "/utente"
          ? pathname === href // Dashboard só ativo se for exatamente /utente
          : pathname === href || pathname.startsWith(href + "/"))
      : false;
  return (
    <Link
      href={href}
      className={
        className + (isActive ? ` ${activeClassName}` : "")
      }
      {...props}
    >
      {children}
    </Link>
  );
}
