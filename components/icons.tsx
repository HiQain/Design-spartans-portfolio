import type { SVGProps } from "react";

export function X(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ArrowUp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function GooglePlay(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" {...props}>
      <path d="M99.6 8.6C93 12.3 88 19 88 28.8v454.4c0 9.8 5 16.5 11.6 20.2l255.9-247.7L99.6 8.6z" fill="#00d2ff" />
      <path d="M99.6 8.6l255.9 247.1 74.6-72.2c14.6-14.1 14.6-38.9 0-53L154.6 8.6c-16.6-9.6-38.6-9.6-55 0z" fill="#3bde42" />
      <path d="M355.5 255.7L99.6 503.4c16.4 9.5 38.4 9.6 55 0l275.5-121.9c14.6-14.1 14.6-38.9 0-53l-74.6-72.8z" fill="#f8bd00" />
      <path d="M99.6 8.6c-6.6 3.7-11.6 10.4-11.6 20.2v454.4c0 9.8 5 16.5 11.6 20.2l255.9-247.7L99.6 8.6z" fillOpacity="0" />
      <path d="M355.5 255.7l74.6 71.7c14.6-14.1 14.6-38.9 0-53l-74.6-71.7-74.6 72.2 74.6 80.8z" fill="#ff3131" />
    </svg>
  );
}

export function AppleLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 384 512" fill="currentColor" {...props}>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}
