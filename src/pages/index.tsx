import * as React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import SEO, { rootTitle } from "../components/seo"
import { rhythm } from "../utils/typography"
import { MarkdownRemarkConnection, SiteNode } from "../queries"
import HeroImage from "../components/heroImage"
import CurrentlyReading from "../components/currentlyReading"

class BlogIndex extends React.Component<BlogIndexProps, {}> {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const posts = data.allMarkdownRemark.edges



    return (
      <Layout location={this.props.location}>
        <SEO title={rootTitle}/>
        <HeroImage />
        <CurrentlyReading />
        {posts.map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          // Hack because description is a required field in Netlify CMS
          // Related: https://github.com/netlify/netlify-cms/issues/315
          const description = !node.frontmatter.description || node.frontmatter.description == " " ? node.excerpt : node.frontmatter.description
          return (
            <article key={node.fields.slug}>
              <header>
                <h3
                  style={{
                    marginBottom: rhythm(1 / 4),
                  }}
                >
                  <Link style={{ textDecoration: `none` }} to={node.fields.slug}>
                    {title}
                  </Link>
                </h3>
                <small>{node.frontmatter.date}</small>
              </header>
              <section>
                <p
                  dangerouslySetInnerHTML={{
                    __html: description,
                  }}
                />
              </section>
            </article>
          )
        })}
      </Layout>
    )
  }
}

export default BlogIndex

interface BlogIndexQuery {
  site: SiteNode
  allMarkdownRemark: MarkdownRemarkConnection
}

interface BlogIndexProps {
  data: BlogIndexQuery,
  location: Location
}

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            description
          }
        }
      }
    }
  }
`
