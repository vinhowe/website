import * as React from "react"
import { Link, graphql } from "gatsby"

import { MDXRenderer } from "gatsby-plugin-mdx"
import SEO from "../../components/seo"
import { rhythm, scale } from "../../utils/typography"
import Nav from "../../components/nav"
import showStopsStyles from "./showStops.module.css"
import ViralViz from "./viralViz"
import ViralVizLegend from "./viralVizLegend"

interface ShowStopsLayoutProps {
  data: BlogPostData
  location: Location
  pageContext: any
}

interface ShowStopsLayoutState {
  vizAnimating: boolean
  vizInitialAnimation: boolean
  startTime: number
  time: number
}

class ShowStopsLayout extends React.Component<
  ShowStopsLayoutProps,
  ShowStopsLayoutState
> {
  lastBackgroundColor = ""
  requestFrameFun: any

  constructor(props: any) {
    super(props)
    const startTime = (new Date()).getTime()
    this.state = {
      vizAnimating: true,
      vizInitialAnimation: true,
      startTime,
      time: startTime
    }
    this.onVizToggle = this.onVizToggle.bind(this)
    this.getElapsed = this.getElapsed.bind(this)
    this.updateTitleAnimation = this.updateTitleAnimation.bind(this)
  }

  componentDidMount(): void {
    this.lastBackgroundColor = document.body.style.backgroundColor
    document.body.style.backgroundColor = "#0b0231"

    this.requestFrameFun = requestAnimationFrame(this.updateTitleAnimation)
    // window.onload = (_) => requestAnimationFrame(this.updateTitleAnimation)
  }

  getElapsed = () => this.state.time - this.state.startTime

  updateTitleAnimation(time: number) {
    this.setState({
      time: (new Date()).getTime(),
    })
    // 5 seconds to give the last part time to animate
    if (this.getElapsed() < 5000) {
      requestAnimationFrame(this.updateTitleAnimation)
    }
  }

  componentWillUnmount(): void {
    document.body.style.backgroundColor = this.lastBackgroundColor
    cancelAnimationFrame(this.requestFrameFun)
    const startTime = (new Date()).getTime()
    this.setState({
      startTime,
      time: startTime
    })
  }

  onVizToggle(animating: boolean): void {
    this.setState({
      vizAnimating: animating,
      vizInitialAnimation: false,
    })
  }

  render() {
    const post = this.props.data.mdx
    // const siteTitle = this.props.data.site.siteMetadata.title
    const { previous, next } = this.props.pageContext

    return (
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          maxWidth: "600px",
          maxHeight: "100vh",
          padding: `${rhythm(3 / 4)} ${rhythm(3 / 4)} ${rhythm(1.5)}`,
          color: "white",
          background: "linear-gradient(transparent, rgba(11, 2, 49, 0.25), rgba(11,2,49,1))",
        }}
        className={showStopsStyles.theShowStops}
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
                marginTop: rhythm(1.5),
                marginBottom: rhythm(2),
                fontWeight: "lighter",
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
              className={showStopsStyles.featureTitle}
            >
              <span
                style={{
                  opacity: this.getElapsed() > 200 ? 1 : 0,
                  // zIndex: -1000,
                }}
              >
                The Show
              </span>
              <span style={{ display: "flex", textAlign: "center" }}>
                <ViralViz onToggle={this.onVizToggle} />{" "}
                <span
                  style={{
                    fontWeight: "normal",
                    transition: "none",
                    opacity: this.state.vizInitialAnimation ? 0 : 1,
                    // zIndex: -1000,
                  }}
                  className={
                    !this.state.vizAnimating
                      ? showStopsStyles.featureTitleOutline
                      : ""
                  }
                >
                  Stops
                </span>
              </span>
            </h1>
            <ViralVizLegend/>
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
