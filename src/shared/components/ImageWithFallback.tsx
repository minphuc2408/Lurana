import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='88'/%3E";

export function ImageWithFallback({ src, alt, className, onError, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = failedSource === (src ?? "");
  return <img {...props} src={failed ? placeholder : src} alt={alt ?? "Image"} data-image-fallback={failed || undefined}
    className={cn(className, failed && "bg-lunara-rose-strong object-contain p-6 [mask-image:var(--lunara-image-placeholder)] [mask-size:contain] [mask-origin:content-box] [mask-clip:content-box] [mask-position:center] [mask-repeat:no-repeat]")}
    onError={event => { if (!failed) setFailedSource(src ?? ""); onError?.(event); }} />;
}
