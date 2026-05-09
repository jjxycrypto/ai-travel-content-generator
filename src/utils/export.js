export function copyText(text) {
  navigator.clipboard.writeText(text);
}

export function exportTxt(dest, results) {
  const content = Object.entries(results)
    .map((entry) => "【" + entry[1].label + "】\n\n" + entry[1].content)
    .join("\n\n" + "=".repeat(40) + "\n\n");
  downloadBlob(content, dest + "-旅游内容.txt", "text/plain;charset=utf-8");
}

export function exportWord(dest, results) {
  const content = Object.entries(results)
    .map((entry) => "<h2>" + entry[1].label + "</h2><p>" + entry[1].content.replace(/\n/g, "</p><p>") + "</p>")
    .join("<hr/>");
  const html = "<html><head><meta charset='utf-8'><title>旅游内容</title></head><body>" + content + "</body></html>";
  downloadBlob(html, dest + "-旅游内容.doc", "application/msword");
}

export function exportBatch(batchResults) {
  const content = batchResults
    .map(function (item) {
      return (
        "📍 " + item.dest + "\n" + "=".repeat(40) + "\n\n" +
        Object.entries(item.results)
          .map((entry) => "【" + entry[1].label + "】\n\n" + entry[1].content)
          .join("\n\n" + "-".repeat(30) + "\n\n")
      );
    })
    .join("\n\n" + "=".repeat(60) + "\n\n");
  downloadBlob(content, "批量旅游内容.txt", "text/plain;charset=utf-8");
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
