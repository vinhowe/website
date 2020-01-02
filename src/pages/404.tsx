import * as React from "react"
import { graphql, Link } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"
import { SiteNode } from "../queries"

class NotFoundPage extends React.Component<NotFoundPageProps, {}> {
  render() {
    const { data }: { data: NotFoundPageQuery} = this.props
    const siteTitle = data.site.siteMetadata.title

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO title="Not found" />
        <h1>Nothing here</h1>
        <p>Head back <Link to={'/'}>home</Link>?</p>
      </Layout>
    )
  }
}

interface NotFoundPageQuery {
  site: SiteNode
}

interface NotFoundPageProps {
  data: NotFoundPageQuery
  location: Location
}

export default NotFoundPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
