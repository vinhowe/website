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

export type MarkdownRemarkConnection = Connection<MarkdownRemarkNode>