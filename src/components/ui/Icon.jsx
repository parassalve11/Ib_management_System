export default function Icon({ name, size = 16, ...props }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    chevron: <path d="m8 10 4 4 4-4"/>,
    left: <path d="m14 6-6 6 6 6"/>,
    right: <path d="m10 6 6 6-6 6"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    external: <><path d="M14 4h6v6m0-6-9 9"/><path d="M10 5H5v14h14v-5"/></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4"/><path d="M4 15v5h16v-5"/></>,
    upload: <><path d="M12 16V4m-4 4 4-4 4 4"/><path d="M4 16v4h16v-4"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    hidden: <><path d="m3 3 18 18M9 6.5A12 12 0 0 1 12 6c6.5 0 10 6 10 6a20 20 0 0 1-3.5 4M6 7.5A19 19 0 0 0 2 12s3.5 6 10 6a13 13 0 0 0 4-.6"/></>,
    back: <path d="M20 12H4m6-6-6 6 6 6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    sort: <path d="M12 19V5m-4 4 4-4 4 4"/>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/></>,
    logout: <><path d="M9 4H4v16h5m5-13 5 5-5 5m-5-5h10"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.chevron}</svg>;
}
