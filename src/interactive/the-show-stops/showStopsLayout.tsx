import * as React from "react"
import { Link, graphql } from "gatsby"

import { MDXRenderer } from "gatsby-plugin-mdx"
import SEO from "../../components/seo"
import { rhythm, scale } from "../../utils/typography"
import Nav from "../../components/nav"
import "./showStops.css"
import ViralViz from "./viralViz"

interface ShowStopsLayoutProps {
  data: BlogPostData
  location: Location
  pageContext: any
}

interface ShowStopsLayoutState {
  vizAnimating: boolean
}

class ShowStopsLayout extends React.Component<
  ShowStopsLayoutProps,
  ShowStopsLayoutState
> {
  lastBackgroundColor = ""

  constructor(props: any) {
    super(props)
    this.lastBackgroundColor = document.body.style.backgroundColor
    this.state = {
      vizAnimating: true,
    }
    this.onVizToggle = this.onVizToggle.bind(this)
    document.body.style.backgroundColor = "black"
  }

  componentWillUnmount(): void {
    document.body.style.backgroundColor = this.lastBackgroundColor
  }

  onVizToggle(animating: boolean): void {
    this.setState({
      vizAnimating: animating,
    })
  }

  render() {
    const post = this.props.data.mdx
    const siteTitle = this.props.data.site.siteMetadata.title
    const { previous, next } = this.props.pageContext

    return (
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          maxWidth: "600px",
          padding: `${rhythm(3 / 4)} ${rhythm(3 / 4)} ${rhythm(1.5)}`,
          color: "white",
        }}
        className={"the-show-stops-wasm"}
      >
        <SEO
          title={post.frontmatter.title}
          description={post.frontmatter.description || post.excerpt}
        />
        <Nav accentColor={"white"} />
        <article>
          <header>
            <h1
              style={{
                marginTop: rhythm(1),
                marginBottom: rhythm(1),
                fontWeight: "lighter",
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
              className={"feature-title"}
            >
              The Show
              <span style={{ display: "flex", textAlign: "center" }}>
                <ViralViz onToggle={this.onVizToggle} />{" "}
                <span
                  style={{ fontWeight: "normal" }}
                  className={
                    !this.state.vizAnimating ? "feature-title-outline" : ""
                  }
                >
                  Stops
                </span>
              </span>
            </h1>
            <p
              style={{
                ...scale(-1 / 15),
                display: `block`,
                marginBottom: rhythm(1),
              }}
            >
              {post.frontmatter.date}
            </p>
          </header>
          <MDXRenderer>{post.body}</MDXRenderer>

          <footer>
            <p>vin</p>
          </footer>
        </article>
        <nav>
          <ul
            style={{
              display: `flex`,
              flexWrap: `wrap`,
              justifyContent: `space-between`,
              listStyle: `none`,
              padding: 0,
            }}
          >
            <li>
              {previous && (
                <Link to={previous.fields.slug} rel="prev">
                  ← {previous.frontmatter.title}
                </Link>
              )}
            </li>
            <li>
              {next && (
                <Link to={next.fields.slug} rel="next">
                  {next.frontmatter.title} →
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    )
  }
}

interface Frontmatter {
  title: string
  date: string
  description: string
}

interface MdxItem {
  id: string
  excerpt: string
  body: string
  frontmatter: Frontmatter
}

interface PageSiteMetadata {
  title: string
}

interface PageSite {
  siteMetadata: PageSiteMetadata
}

interface BlogPostData {
  mdx: MdxItem
  site: PageSite
}

export default ShowStopsLayout

export const pageQuery = graphql`
  query BlankLayoutBlogPostById($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
    mdx(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      body
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
      }
    }
  }
`
