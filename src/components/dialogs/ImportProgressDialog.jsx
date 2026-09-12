"use client";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import Icon from "../ui/Icon";
export default function ImportProgressDialog({ phase, fileName, recordCount }) {
  const importing = phase === "import";
  return <Modal title={importing ? "Importing IB records" : "Preparing your workbook"} subtitle="Excel import" onClose={() => {}} dismissible={false} className="import-progress-dialog">
    <div className="import-progress-body" aria-busy="true">
      <div className="import-progress-icon"><Spinner size={36}/></div>
      <h3>{importing ? `Saving ${recordCount.toLocaleString()} records` : "Uploading and validating your data"}</h3>
      <p>{importing ? "Your records are being saved. This dialog will close when the import is complete." : "Checking the worksheet, required fields and possible duplicates before you import."}</p>
      <div className="import-progress-file"><Icon name="upload" size={17}/><span>{fileName}</span></div>
      <div className="import-progress-track" role="progressbar" aria-label={importing ? "Saving IB records" : "Validating Excel workbook"} aria-valuetext="In progress"><span/></div>
      <div className="import-progress-stages"><span className={importing ? "done" : "current"}>{importing && <Icon name="check" size={13}/>}Validate workbook</span><span className={importing ? "current" : ""}>Save records</span></div>
      <small role="status">{importing ? "Please keep this page open while your records are saved." : "Large workbooks may take a few moments to check."}</small>
    </div>
  </Modal>;
}
