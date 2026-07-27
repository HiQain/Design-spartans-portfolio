import Image, { type ImageProps } from "next/image";

/**
 * Some Firestore documents store `imageUrl` as an inline base64 data: URI instead of a
 * Storage URL (see sanitizeUrl in lib/portfolio-utils). next/image's optimizer can't
 * proxy those, so fall back to a plain <img> for that case only.
 */
export default function SmartImage({ src, alt, className, fill, sizes, ...props }: ImageProps) {
  const isDataUri = typeof src === "string" && src.startsWith("data:");

  if (isDataUri) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src as string}
        alt={alt}
        className={fill ? `absolute inset-0 h-full w-full ${className ?? ""}` : className}
      />
    );
  }

  return <Image src={src} alt={alt} className={className} fill={fill} sizes={sizes} {...props} />;
}
