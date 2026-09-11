import { countryFor } from "@/lib/countries";
export default function Flag({ code, label = true }) {
  const country = countryFor(code);
  return <span className="country-cell"><span className={`fi fi-${code.toLowerCase()}`} role="img" aria-label={country?.name || code}/>{label && <span>{country?.label || code}</span>}</span>;
}
