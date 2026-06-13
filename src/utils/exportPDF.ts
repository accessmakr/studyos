import jsPDF from 'jspdf'

export async function generatePDF(data: any, filename: string) {
  const doc = new jsPDF()
  let y = 20
  
  doc.setFontSize(16)
  doc.text('StudyOS Export', 20, y)
  y += 15
  
  doc.setFontSize(12)
  doc.text('Summary:', 20, y)
  y += 8
  doc.setFontSize(10)
  doc.text(data.summary, 20, y, { maxWidth: 170 })
  y += 40
  
  doc.setFontSize(12)
  doc.text('Flashcards:', 20, y)
  y += 8
  data.flashcards.forEach((card: any, i: number) => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.setFontSize(10)
    doc.text(`Q${i+1}: ${card.q}`, 20, y, { maxWidth: 170 })
    y += 8
    doc.text(`A: ${card.a}`, 25, y, { maxWidth: 165 })
    y += 12
  })
  
  doc.save(`${filename}.pdf`)
}
