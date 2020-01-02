import * as React from "react"

import { rhythm, scale } from "../utils/typography"
import Nav from "./nav"
import { graphql, useStaticQuery } from "gatsby"
import { CSSProperties, ReactNode, ReactPropTypes } from "react"
import { SocialNode } from "../queries"

import "../shared.css"

interface LayoutProps {
  location: Location
  title: string
  children?: ReactNode;
}

// class Layout extends React.Component<LayoutProps, {}> {
// render() {
const Layout = (props: LayoutProps) => {

  const data = useStaticQuery(graphql`
      query LayoutQuery {
          site {
              siteMetadata {
                  author
                  social {
                      name
                      url
                  }
              }
          }
      }
  `)

  const { location, title, children } = props

  const rootPath = `${__PATH_PREFIX__}/`

  const { author, social }: { author: string, social: SocialNode[] } = data.site.siteMetadata

  const socialElements = social.map((item: SocialNode, i: number) => {
    let style: CSSProperties = {
      marginBottom: i !== social.length - 1 ? rhythm(0.25) : undefined,
    }

    return (
      <a style={style} href={item.url}>{item.name.toLowerCase()}</a>
    )
  })

  return (
    <div
      style={{
        marginLeft: `auto`,
        marginRight: `auto`,
        maxWidth: "600px",
        padding: `${rhythm(3 / 4)} ${rhythm(3 / 4)} ${rhythm(1.5)}`,
      }}
    >
      <Nav/>
      <main>{children}</main>
      {/* TODO Replace "Vin Howe" with a siteMetadata query */}
      <hr/>
      <footer style={{ display: "flex", justifyContent: "space-between" }}>
        <p>© {new Date().getFullYear()} {author}</p>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <p className={"hide-mobile-600"} style={{ marginRight: rhythm(1)}}>find me on: </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {socialElements}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
