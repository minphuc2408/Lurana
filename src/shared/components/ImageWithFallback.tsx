import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 88 88'%3E%3Cg fill='none' stroke='%239D586B' stroke-width='3'%3E%3Crect x='16' y='16' width='56' height='56' rx='6'/%3E%3Cpath d='m16 58 16-18 32 32'/%3E%3Ccircle cx='53' cy='35' r='7'/%3E%3C/g%3E%3C/svg%3E";

export function ImageWithFallback({ src, alt, className, onError, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = failedSource === (src ?? "");
  return <img {...props} src={failed ? placeholder : src} alt={alt ?? "Image"}
    className={cn(className, failed && "bg-lunara-blush object-contain p-6")}
    onError={event => { if (!failed) setFailedSource(src ?? ""); onError?.(event); }} />;
}
