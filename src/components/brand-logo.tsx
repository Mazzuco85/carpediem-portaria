import type { CSSProperties } from "react";
import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  size?: "sidebar" | "login";
};

const SIZE_STYLES: Record<NonNullable<BrandLogoProps["size"]>, CSSProperties> = {
  sidebar: { width: 96, height: 40 },
  login: { width: 320, maxWidth: "100%", height: 120 },
};

export function BrandLogo({ className, priority = false, size = "sidebar" }: BrandLogoProps) {
  const dimensions = SIZE_STYLES[size];

  return (
    <div
      className={className}
      style={{
        ...dimensions,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src="/branding/logo-helbor-carpe-diem.png"
        alt="Helbor Carpe Diem"
        fill
        priority={priority}
        sizes={size === "login" ? "(max-width: 768px) 90vw, 320px" : "96px"}
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}
