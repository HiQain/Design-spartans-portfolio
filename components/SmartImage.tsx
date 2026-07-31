import type { CSSProperties, ImgHTMLAttributes } from "react";

type SmartImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
};

/**
 * Small wrapper retained so the grids can keep a single image component after
 * the move away from Next.js.
 */
export default function SmartImage({
  src,
  alt,
  className,
  fill = false,
  style,
  ...props
}: SmartImageProps) {
  const fillStyle: CSSProperties | undefined = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }
    : style;

  return <img src={src} alt={alt} className={className} style={fillStyle} {...props} />;
}
