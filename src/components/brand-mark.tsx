import Image from 'next/image';
export function BrandMark() {
  return (
    <Image
      src="/brand/duo-mark.svg"
      width={32}
      height={32}
      alt=""
      aria-hidden="true"
      className="brand-symbol"
    />
  );
}
