import Image from "next/image";
import Link from "next/link";
export default function Logo({ large = false, linked = true }) {
  const content = <Image src="/bytefx.png" alt="ByteFX" width={385} height={76} priority className={large ? "brand-logo brand-logo-large" : "brand-logo"} />;
  return linked ? <Link href="/ib-records" aria-label="ByteFX — IB Records" className="brand-link">{content}</Link> : content;
}
