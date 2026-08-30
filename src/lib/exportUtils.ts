import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportAgendaToPDF(appointments: any[], commercialName: string, dateStr: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(`Agenda Commerciale: ${commercialName}`, 14, 20);
  doc.setFontSize(12);
  doc.text(`Data: ${dateStr}`, 14, 30);
  
  const tableData = appointments.map(app => {
    let cleanReferentName = app.referentName;
    try {
      const parsed = JSON.parse(app.referentName);
      if (Array.isArray(parsed)) {
        cleanReferentName = parsed.map((p: any) => p.name).join(", ");
      }
    } catch {}

    return [
      new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      app.contact.name,
      app.contact.address || "-",
      app.contact.cap,
      app.phone,
      `${cleanReferentName} (${app.referentRole})`,
      app.clientNeeds || "-"
    ];
  });

  autoTable(doc, {
    startY: 40,
    head: [["Ora", "Azienda", "Indirizzo", "CAP", "Telefono", "Referente", "Necessità"]],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}
