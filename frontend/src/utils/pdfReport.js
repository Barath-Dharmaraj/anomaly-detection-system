import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
export function downloadPredictionReport(prediction, inputData) {
  const doc = new jsPDF()
  const isAnomaly = prediction.is_anomaly
  doc.setFillColor(10,10,10); doc.rect(0,0,210,42,'F')
  doc.setTextColor(240,240,240); doc.setFontSize(20); doc.setFont('helvetica','bold')
  doc.text('AnomalyGuard',14,18)
  doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(136,136,136)
  doc.text('Fraud & Intrusion Detection Report',14,28)
  doc.setFontSize(9); doc.text(`Generated: ${format(new Date(),'PPpp')}`,14,36)
  const rc = isAnomaly ? [255,59,59] : [34,197,94]
  doc.setFillColor(...rc); doc.roundedRect(14,50,182,20,3,3,'F')
  doc.setTextColor(255,255,255); doc.setFontSize(13); doc.setFont('helvetica','bold')
  doc.text(isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL TRANSACTION',105,62,{align:'center'})
  autoTable(doc,{startY:78,head:[['Metric','Value']],body:[
    ['Anomaly Score',`${(prediction.anomaly_score*100).toFixed(1)}%`],
    ['Risk Level',prediction.risk_level],['Confidence',`${(prediction.confidence*100).toFixed(1)}%`],
    ['Prediction ID',String(prediction.id)],
  ],theme:'grid',headStyles:{fillColor:[26,26,26],textColor:[240,240,240]},margin:{left:14,right:14}})
  autoTable(doc,{startY:doc.lastAutoTable.finalY+10,head:[['Feature','Value']],
    body:Object.entries(inputData).map(([k,v])=>[k.replace(/_/g,' '),String(v)]),
    theme:'striped',headStyles:{fillColor:[26,26,26],textColor:[240,240,240]},margin:{left:14,right:14}})
  if (prediction.feature_importance) {
    const sorted=Object.entries(prediction.feature_importance).sort(([,a],[,b])=>b-a).slice(0,8).map(([k,v])=>[k.replace(/_/g,' '),(v*100).toFixed(2)+'%'])
    autoTable(doc,{startY:doc.lastAutoTable.finalY+10,head:[['Feature','Importance']],body:sorted,
      theme:'striped',headStyles:{fillColor:[26,26,26],textColor:[240,240,240]},margin:{left:14,right:14}})
  }
  for (let i=1;i<=doc.internal.getNumberOfPages();i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150)
    doc.text(`AnomalyGuard v1.0 — Page ${i}`,105,290,{align:'center'})
  }
  doc.save(`anomaly-report-${prediction.id}.pdf`)
}
