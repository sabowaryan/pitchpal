import * as puppeteer from 'puppeteer'

import { Pitch } from '@/types/pitch'
import { generateProfessionalTemplate } from './templates/professional-template'
import { generateStartupTemplate } from './templates/startup-template'

export interface PDFOptions {
  format?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  quality?: 'high' | 'medium' | 'low'
  includeBackground?: boolean
}

export async function generatePDF(
  pitch: Pitch,
  options: PDFOptions = {}
): Promise<Buffer> {
  const {
    format = 'A4',
    orientation = 'portrait',
    quality = 'high',
    includeBackground = true
  } = options

  let browser: puppeteer.Browser | null = null

  try {
    // Launch browser with optimized settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()

    // Set viewport for consistent rendering
    await page.setViewport({
      width: format === 'A4' ? 794 : 816, // A4: 794px, Letter: 816px at 96 DPI
      height: format === 'A4' ? 1123 : 1056,
      deviceScaleFactor: quality === 'high' ? 2 : 1
    })

    // Generate HTML template based on tone
    const html = getTemplateForTone(pitch)

    // Set content and wait for fonts/images to load
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    })

    // Add custom fonts if needed
    await page.addStyleTag({
      url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
    })

    // Wait a bit more for fonts to load
    await (page as any).waitForTimeout(2000)


    // Generate PDF with high quality settings
    const pdfBuffer = await page.pdf({
      format: format,
      landscape: orientation === 'landscape',
      printBackground: includeBackground,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      // High quality settings
      ...(quality === 'high' && {
        quality: 100,
        omitBackground: false,
      })
    })

    return Buffer.from(pdfBuffer)

  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error(`Erreur lors de la génération PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

function getTemplateForTone(pitch: Pitch): string {
  switch (pitch.tone) {
    case 'startup':
      return generateStartupTemplate(pitch)
    case 'professional':
    case 'tech':
    case 'fun':
    default:
      return generateProfessionalTemplate(pitch)
  }
}

// Utility function to estimate PDF size
export function estimatePDFSize(pitch: Pitch): { pages: number, estimatedSizeMB: number } {
  const basePages = 3 // Cover + Summary + Market pages
  const slidePages = pitch.pitchDeck.slides.length
  const totalPages = basePages + slidePages

  // Rough estimation: ~200KB per page for high quality
  const estimatedSizeMB = (totalPages * 200) / 1024

  return {
    pages: totalPages,
    estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100
  }
}

// Function to generate preview images
export async function generatePDFPreview(pitch: Pitch): Promise<Buffer[]> {
  let browser: puppeteer.Browser | null = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })

    const html = getTemplateForTone(pitch)
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Generate preview images for first 3 pages
    const previews: Buffer[] = []
    const pages = Math.min(3, 3 + pitch.pitchDeck.slides.length)

    for (let i = 0; i < pages; i++) {
      const screenshot = await page.screenshot({
        type: 'png',
        quality: 80,
        clip: {
          x: 0,
          y: i * 1123,
          width: 794,
          height: 1123
        }
      })
      previews.push(Buffer.from(screenshot))
    }

    return previews

  } catch (error) {
    console.error('Preview generation error:', error)
    throw new Error('Erreur lors de la génération des aperçus')
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}