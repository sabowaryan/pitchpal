'use client'

import { Pitch } from '@/types/pitch'
import { PitchSections } from './pitch-sections'
import { PitchPreview } from './pitch-preview'
import { PitchExport } from './pitch-export'
import { PitchStats } from './pitch-stats'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Eye, Download, BarChart3 } from 'lucide-react'

interface PitchDisplayProps {
  pitch: Pitch
}

export function PitchDisplay({ pitch }: PitchDisplayProps) {
  return (
    <div className="space-y-8">
      {/* Pitch Header */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white p-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          {pitch.tagline}
        </h2>
        <p className="text-primary-100 text-lg">
          Pitch généré en ton {pitch.tone} • {new Date(pitch.createdAt || new Date()).toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="sections" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border-2 border-neutral-200 rounded-xl p-1">
          <TabsTrigger value="sections" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Sections</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="mt-6">
          <PitchSections pitch={pitch} />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <PitchPreview pitch={pitch} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <PitchStats pitch={pitch} />
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <PitchExport pitch={pitch} />
        </TabsContent>
      </Tabs>
    </div>
  )
}