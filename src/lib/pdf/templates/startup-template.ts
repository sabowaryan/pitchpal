import { Pitch } from '@/types/pitch'

export function generateStartupTemplate(pitch: Pitch): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Startup Pitch - ${pitch.tagline}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #0f172a;
            background: #ffffff;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            background: white;
            page-break-after: always;
            position: relative;
          }

          .page:last-child {
            page-break-after: avoid;
          }

          /* Startup Theme - More Dynamic */
          .cover-page {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
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
            background: 
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
            animation: float 15s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }

          .startup-logo {
            font-size: 72px;
            margin-bottom: 20px;
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
          }

          .cover-tagline {
            font-size: 52px;
            font-weight: 900;
            margin-bottom: 25px;
            background: linear-gradient(135deg, #ffffff, #e2e8f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.1;
            text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
          }

          .startup-badge {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
          }

          /* Content Styling */
          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 3px solid;
            border-image: linear-gradient(90deg, #f59e0b, #d97706) 1;
          }

          .section {
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc, #f1f5f9);
            border-radius: 15px;
            border-left: 5px solid #f59e0b;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }

          .section-title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .section-emoji {
            font-size: 28px;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          }

          .disruptive-highlight {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: #92400e;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border: none;
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
          }

          .growth-metrics {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 25px 0;
          }

          .metric-card {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }

          .metric-value {
            font-size: 28px;
            font-weight: 900;
            color: #f59e0b;
            margin-bottom: 5px;
          }

          @media print {
            body { -webkit-print-color-adjust: exact; }
          }

          @page { size: A4; margin: 0; }
        </style>
      </head>
      <body>
        <!-- Cover Page -->
        <div class="page cover-page">
          <div style="position: relative; z-index: 2;">
            <div class="startup-logo">🚀</div>
            <div class="startup-badge">Startup Pitch</div>
            <h1 class="cover-tagline">${pitch.tagline}</h1>
            <p style="font-size: 22px; margin-bottom: 40px; opacity: 0.9;">
              Disrupting the market with innovation
            </p>
            
            <div class="growth-metrics" style="max-width: 500px;">
              <div class="metric-card">
                <div class="metric-value">∞</div>
                <div style="font-size: 12px; color: #cbd5e1;">Potential</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${pitch.pitchDeck.slides.length}</div>
                <div style="font-size: 12px; color: #cbd5e1;">Slides</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">1</div>
                <div style="font-size: 12px; color: #cbd5e1;">Vision</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Problem & Solution -->
        <div class="page">
          <div class="page-header">
            <h2 style="font-size: 28px; font-weight: 800;">🎯 Problem & Solution</h2>
            <div style="color: #6b7280;">Page 2</div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="section-emoji">💥</span>
              The Problem We're Solving
            </div>
            <div style="font-size: 18px; line-height: 1.7;">${pitch.problem}</div>
          </div>

          <div class="disruptive-highlight">
            <div style="font-size: 20px; font-weight: 800; margin-bottom: 10px;">
              🚀 Our Disruptive Solution
            </div>
            <div style="font-size: 16px; line-height: 1.6;">${pitch.solution}</div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="section-emoji">⚡</span>
              Competitive Advantage
            </div>
            <div style="font-size: 18px; line-height: 1.7;">${pitch.competitiveAdvantage}</div>
          </div>
        </div>

        <!-- Market & Business Model -->
        <div class="page">
          <div class="page-header">
            <h2 style="font-size: 28px; font-weight: 800;">📈 Market & Growth</h2>
            <div style="color: #6b7280;">Page 3</div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="section-emoji">🎯</span>
              Target Market
            </div>
            <div style="font-size: 18px; line-height: 1.7;">${pitch.targetMarket}</div>
          </div>

          <div class="section">
            <div class="section-title">
              <span class="section-emoji">💰</span>
              Revenue Model
            </div>
            <div style="font-size: 18px; line-height: 1.7;">${pitch.businessModel}</div>
          </div>
        </div>

        <!-- Detailed Slides -->
        ${pitch.pitchDeck.slides.map((slide, index) => `
          <div class="page">
            <div class="page-header">
              <h2 style="font-size: 24px; font-weight: 800;">${slide.title}</h2>
              <div style="color: #6b7280;">Page ${index + 4}</div>
            </div>

            <div class="section">
              <div style="font-size: 18px; line-height: 1.8;">
                ${slide.content.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
        `).join('')}
      </body>
    </html>
  `
}