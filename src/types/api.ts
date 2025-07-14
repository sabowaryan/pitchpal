import { Pitch } from './pitch'

export interface GeneratePitchRequest {
  idea: string
  tone: string
}

export interface GeneratePitchResponse {
  pitch: Pitch
}

export interface SavePitchRequest {
  pitch: Pitch
  userId?: string
}

export interface SavePitchResponse {
  success: boolean
  pitchId: string
}

export interface ExportPDFRequest {
  pitch: Pitch
}

export interface ExportPDFResponse {
  pdfUrl: string
}

export interface ApiError {
  error: string
  message: string
} 