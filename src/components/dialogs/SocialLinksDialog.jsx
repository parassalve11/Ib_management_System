import Modal from "../ui/Modal";
import Icon from "../ui/Icon";
import { socialPlatforms } from "@/lib/records";
export function SocialIcon({ platform }) {
  return <span className={`social-icon ${platform.toLowerCase()}`} aria-hidden="true">
    {platform === "YouTube" ? <svg viewBox="0 0 24 24"><rect x="1" y="5" width="22" height="15" rx="5" fill="#f52325"/><path d="m10 9 6 3.5-6 3.5Z" fill="white"/></svg> :
    platform === "Telegram" ? <svg viewBox="0 0 24 24"><path d="m3 11 17-7-3 17-6-5-4 3 1-6Z" fill="white"/><path d="m8 13 9-6-6 9" fill="none" stroke="#41b4e5"/></svg> :
    platform === "Instagram" ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="white" stroke="none"/></svg> :
    platform === "TikTok" ? <svg viewBox="0 0 24 24"><path d="M14 4v11a4 4 0 1 1-4-4m4-7q1 5 6 5" fill="none" stroke="#34ece3" strokeWidth="3.5"/><path d="M13 3v11a4 4 0 1 1-4-4m4-7q1 5 6 5" fill="none" stroke="white" strokeWidth="2.5"/></svg> :
    <svg viewBox="0 0 24 24"><path d="M7 10C5 2 19 2 17 10l2 2-2 1c0 3 2 3 3 4l-4 1-1 2-3-1-3 1-1-2-4-1c1-1 3-1 3-4l-2-1Z" fill="white" stroke="#222" strokeWidth=".8"/></svg>}
  </span>;
}
export default function SocialLinksDialog({ record, onClose }) {
  return <Modal title="Social Links" subtitle={record.channelName} onClose={onClose} className="social-modal">
    <div className="social-list">{socialPlatforms.filter(p => record[p.key]).map(p => <div className="social-row" key={p.key}><SocialIcon platform={p.label}/><div className="social-info"><strong>{p.label}</strong><span title={record[p.key]}>{record[p.key].replace(/^https:\/\//,"")}</span></div><a className="button small outline-blue" href={record[p.key]} target="_blank" rel="noopener noreferrer"><Icon name="external" size={14}/>Open<span className="sr-only"> {p.label}</span></a></div>)}</div>
  </Modal>;
}
