import {
  File as FileIconLucide,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
} from "lucide-react";

export function FileIcon({
  extension,
  mimeType,
}: {
  extension?: string;
  mimeType?: string;
}) {
  const ext = extension?.toLowerCase() || "";
  const mime = mimeType?.toLowerCase() || "";

  if (ext === "pdf" || mime.includes("pdf"))
    return <FileText className="shrink-0 text-rose-500" size={32} />;
  if (["doc", "docx"].includes(ext) || mime.includes("word"))
    return <FileText className="shrink-0 text-blue-600" size={32} />;
  if (["xls", "xlsx"].includes(ext) || mime.includes("sheet") || mime.includes("excel"))
    return <FileSpreadsheet className="shrink-0 text-emerald-600" size={32} />;
  if (["csv"].includes(ext) || mime.includes("csv"))
    return <FileSpreadsheet className="shrink-0 text-green-600" size={32} />;
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext) || mime.startsWith("image/"))
    return <FileImage className="shrink-0 text-purple-500" size={32} />;
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext))
    return <FileArchive className="shrink-0 text-amber-600" size={32} />;

  return <FileIconLucide className="shrink-0 text-slate-400" size={32} />;
}
