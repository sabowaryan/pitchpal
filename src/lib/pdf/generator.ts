import puppeteer from 'puppeteer'
import { Pitch } from '@/types/pitch'

export async function generatePDF(pitch: Pitch): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pitch Deck - ${pitch.tagline}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 0;
            background: #f8fafc;
          }
          .slide { 
            page-break-after: always; 
            padding: 40px; 
            background: white;
            margin: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .slide:last-child { 
            page-break-after: avoid; 
          }
          h1 { 
            color: #1d4ed8; 
            font-size: 2.5em;
            margin-bottom: 20px;
            text-align: center;
          }
          h2 { 
            color: #3b82f6; 
            font-size: 1.8em;
            margin-bottom: 15px;
          }
          .content {
            font-size: 1.1em;
            line-height: 1.6;
            color: #374151;
          }
          .tagline {
            font-size: 1.3em;
            font-weight: bold;
            text-align: center;
            color: #1f2937;
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>
        <div class="slide">
          <h1>Pitch Deck</h1>
          <div class="tagline">${pitch.tagline}</div>
          <div class="content">
            <h2>Le Problème</h2>
            <p>${pitch.problem}</p>
            
            <h2>La Solution</h2>
            <p>${pitch.solution}</p>
            
            <h2>Marché Cible</h2>
            <p>${pitch.targetMarket}</p>
            
            <h2>Business Model</h2>
            <p>${pitch.businessModel}</p>
            
            <h2>Avantage Concurrentiel</h2>
            <p>${pitch.competitiveAdvantage}</p>
          </div>
        </div>
        
        ${pitch.pitchDeck.slides.map((slide, index) => `
          <div class="slide">
            <h1>Slide ${index + 1}: ${slide.title}</h1>
            <div class="content">${slide.content}</div>
          </div>
        `).join('')}
      </body>
    </html>
  `
  
  await page.setContent(html)
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  })
  
  await browser.close()
  return Buffer.from(pdfBuffer)
} 