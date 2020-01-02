/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import * as React from "react"
import PropTypes from "prop-types"
import Helmet from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"

export const rootTitle = "home";

export interface SEOArgs {
  description: string
  lang: string
  meta: JSX.IntrinsicElements['meta'][]
  title: string
}

function SEO({ description, lang, title, meta }: SEOArgs) {
  const { site } = useStaticQuery(
    graphql`
        query {
            site {
                siteMetadata {
                    title
                    description
                    author
                }
            }
        }
    `,
  )

  const metaDescription = description || site.siteMetadata.description

  title = title ? title : " "

  const titleTemplate = title.toLowerCase() !== rootTitle ? `%s — ${site.siteMetadata.title}` : `${site.siteMetadata.title}`

  const combinedMeta: JSX.IntrinsicElements['meta'][] = [
    {
      name: `description`,
      content: metaDescription,
    },
    {
      property: `og:title`,
      content: title,
    },
    {
      property: `og:description`,
      content: metaDescription,
    },
    {
      property: `og:type`,
      content: `website`,
    },
    {
      name: `twitter:card`,
      content: `summary`,
    },
    {
      name: `twitter:creator`,
      content: site.siteMetadata.author,
    },
    {
      name: `twitter:title`,
      content: title,
    },
    {
      name: `twitter:description`,
      content: metaDescription,
    },
    ...meta
  ]

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={titleTemplate}
      meta={combinedMeta}
    />
  )
}

SEO.defaultProps = {
  lang: `en`,
  meta: [],
  description: ``,
}

SEO.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string,
}

export default SEO