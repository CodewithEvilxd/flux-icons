export function downloadBlob(
  data: Blob | string,
  filename: string,
  mime = "application/octet-stream",
) {
  const blob = typeof data === "string" ? new Blob([data], { type: mime }) : data;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function iconFileSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}
