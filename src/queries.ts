// TODO: This should be more comprehensive
import { rename } from "fs"

export interface Edge<T> {
  node: T
}

export interface Connection<T> {
  edges: Edge<T>[]
}

export interface MarkdownRemarkNode {
  excerpt?: string
  fields?: {
    slug?: string
  },
  frontmatter?: {
    title?: string
    date?: string
    description?: string
  }
}

export interface SiteNode {
  siteMetadata?: {
    title?: string
    accentColor?: string
  }
}

export interface SocialNode {
  name?: string
  url?: string
  username?: string
}

export interface ResumeDateRange {
  startDate: string
  endDate?: string
  current?: boolean
}

export interface ResumeSocialInfo {
  github?: string
  linkedin?: string
  website?: string
}

export interface ResumeContactInfo {
  phoneNumber?: string
  email?: string
}

export interface ResumeInfo {
  lastUpdated?: string
}

export interface ResumeBio {
  name?: string
  location?: string
  blurb?: string
  contact?: ResumeContactInfo
  social?: ResumeSocialInfo
}

export interface ResumeFeaturable {
  featured?: boolean
}

export interface ResumeEducationItem extends ResumeFeaturable {
  name: string
  degree?: string
  major?: string
  location?: string
  dateRange?: ResumeDateRange
  gpaInfo?: {
    gpa: string
    lastUpdated?: string
  }
  relevantCoursework?: {
    code: string
    name?: string
  }[]
  additionalInfo?: string[]
}

export interface ResumeProjectItem extends ResumeFeaturable {
  name?: string
  bullets?: string[]
  technologies?: string[]
  url?: string
  dateRange?: ResumeDateRange
}

export interface ResumeWorkItem extends ResumeFeaturable {
  name?: string
  dateRange?: ResumeDateRange
  url?: string
  location?: string
  position?: string
  bullet?: string[]
}

export interface ResumeSkill extends ResumeFeaturable {
  name?: string
}

export interface ResumeSkills {
  proficient?: ResumeSkill[]
  familiar?: ResumeSkill[]
}

export type MarkdownRemarkConnection = Connection<MarkdownRemarkNode>