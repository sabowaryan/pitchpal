import { Pitch } from '@/types/pitch'

export function generateProfessionalTemplate(pitch: Pitch): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pitch Deck - ${pitch.tagline}</title>
        <style>
          /* Reset and Base Styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #ffffff;
            font-size: 16px;
          }

          /* Page Layout */
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            page-break-after: always;
            position: relative;
          }

          .page:last-child {
            page-break-after: avoid;
          }

          /* Header Styles */
          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #3b82f6;
          }

          .logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            font-weight: bold;
          }

          .logo-text {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .page-number {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }

          /* Cover Page */
          .cover-page {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            min-height: 250mm;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            position: relative;
            overflow: hidden;
          }

          .cover-page::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
            animation: rotate 20s linear infinite;
          }

          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .cover-content {
            position: relative;
            z-index: 2;
            max-width: 600px;
          }

          .cover-tagline {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #1f2937, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
          }

          .cover-subtitle {
            font-size: 20px;
            color: #6b7280;
            margin-bottom: 40px;
            font-weight: 500;
          }

          .cover-meta {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 50px;
          }

          .meta-item {
            text-align: center;
          }

          .meta-label {
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }

          .meta-value {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
          }

          /* Content Slides */
          .slide {
            margin-bottom: 40px;
          }

          .slide-header {
            display: flex;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
          }

          .slide-number {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 18px;
            margin-right: 20px;
            flex-shrink: 0;
          }

          .slide-title {
            font-size: 28px;
            font-weight: 700;
            color: #1f2937;
            flex: 1;
          }

          .slide-content {
            font-size: 18px;
            line-height: 1.8;
            color: #374151;
            padding-left: 60px;
          }

          /* Section Styles */
          .section {
            margin-bottom: 35px;
            padding: 25px;
            background: #f8fafc;
            border-radius: 12px;
            border-left: 5px solid #3b82f6;
          }

          .section-title {
            font-size: 22px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .section-icon {
            width: 24px;
            height: 24px;
            background: #3b82f6;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          }

          .section-content {
            font-size: 16px;
            line-height: 1.7;
            color: #4b5563;
          }

          /* Highlight Boxes */
          .highlight-box {
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
            border: 2px solid #3b82f6;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }

          .highlight-title {
            font-size: 18px;
            font-weight: 700;
            color: #1d4ed8;
            margin-bottom: 10px;
          }

          .highlight-content {
            font-size: 16px;
            color: #1e40af;
            line-height: 1.6;
          }

          /* Stats Grid */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
          }

          .stat-card {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
          }

          .stat-value {
            font-size: 32px;
            font-weight: 800;
            color: #3b82f6;
            margin-bottom: 5px;
          }

          .stat-label {
            font-size: 14px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          /* Footer */
          .page-footer {
            position: absolute;
            bottom: 15mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
          }

          /* Print Styles */
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .page {
              box-shadow: none;
              margin: 0;
            }
          }

          /* Responsive adjustments for PDF generation */
          @page {
            size: A4;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <!-- Cover Page -->
        <div class="page cover-page">
          <div class="cover-content">
            <div class="logo" style="justify-content: center; margin-bottom: 40px;">
              <div class="logo-icon">🚀</div>
              <div class="logo-text">PitchPal</div>
            </div>
            
            <h1 class="cover-tagline">${pitch.tagline}</h1>
            <p class="cover-subtitle">Pitch Deck Professionnel</p>
            
            <div class="cover-meta">
              <div class="meta-item">
                <div class="meta-label">Ton</div>
                <div class="meta-value">${pitch.tone.charAt(0).toUpperCase() + pitch.tone.slice(1)}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Date</div>
                <div class="meta-value">${new Date(pitch.createdAt || new Date()).toLocaleDateString('fr-FR')}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Slides</div>
                <div class="meta-value">${pitch.pitchDeck.slides.length}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Executive Summary Page -->
        <div class="page">
          <div class="page-header">
            <div class="logo">
              <div class="logo-icon">🚀</div>
              <div class="logo-text">PitchPal</div>
            </div>
            <div class="page-number">Page 2</div>
          </div>

          <h1 style="font-size: 36px; font-weight: 800; margin-bottom: 30px; color: #1f2937;">Résumé Exécutif</h1>

          <div class="section">
            <div class="section-title">
              <div class="section-icon">🎯</div>
              Tagline
            </div>
            <div class="section-content">${pitch.tagline}</div>
          </div>

          <div class="section">
            <div class="section-title">
              <div class="section-icon">❌</div>
              Le Problème
            </div>
            <div class="section-content">${pitch.problem}</div>
          </div>

          <div class="section">
            <div class="section-title">
              <div class="section-icon">✅</div>
              La Solution
            </div>
            <div class="section-content">${pitch.solution}</div>
          </div>

          <div class="highlight-box">
            <div class="highlight-title">🚀 Avantage Concurrentiel</div>
            <div class="highlight-content">${pitch.competitiveAdvantage}</div>
          </div>

          <div class="page-footer">
            Généré par PitchPal - ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        <!-- Market & Business Model Page -->
        <div class="page">
          <div class="page-header">
            <div class="logo">
              <div class="logo-icon">🚀</div>
              <div class="logo-text">PitchPal</div>
            </div>
            <div class="page-number">Page 3</div>
          </div>

          <h1 style="font-size: 36px; font-weight: 800; margin-bottom: 30px; color: #1f2937;">Marché & Business Model</h1>

          <div class="section">
            <div class="section-title">
              <div class="section-icon">👥</div>
              Marché Cible
            </div>
            <div class="section-content">${pitch.targetMarket}</div>
          </div>

          <div class="section">
            <div class="section-title">
              <div class="section-icon">💰</div>
              Business Model
            </div>
            <div class="section-content">${pitch.businessModel}</div>
          </div>

          <div class="page-footer">
            Généré par PitchPal - ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        <!-- Detailed Slides -->
        ${pitch.pitchDeck.slides.map((slide, index) => `
          <div class="page">
            <div class="page-header">
              <div class="logo">
                <div class="logo-icon">🚀</div>
                <div class="logo-text">PitchPal</div>
              </div>
              <div class="page-number">Page ${index + 4}</div>
            </div>

            <div class="slide">
              <div class="slide-header">
                <div class="slide-number">${index + 1}</div>
                <h2 class="slide-title">${slide.title}</h2>
              </div>
              <div class="slide-content">
                ${slide.content.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div class="page-footer">
              Généré par PitchPal - ${new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        `).join('')}
      </body>
    </html>
  `
}