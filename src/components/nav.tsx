import * as React from "react"
import { useStaticQuery, graphql, Link } from "gatsby"

import { rhythm, scale } from "../utils/typography"
import { SiteNode } from "../queries"
import { CSSProperties } from "react"

import "./nav.css"

interface NavQuery {
  site: SiteNode
}

interface NavItem {
  name: string
  path: string
}

export interface NavArgs {
  accentColor?: string
  linkColor?: string
}

const Nav = ({ accentColor, linkColor }: NavArgs) => {
  const data: NavQuery = useStaticQuery(graphql`
      query NavQuery {
          site {
              siteMetadata {
                  title
                  accentColor
              }
          }
      }
  `)

  const navItemStyle: CSSProperties = {
    display: "inline",
    marginBottom: 0,
  }

  const navItemLinkStyle = {
    color: linkColor ? linkColor : `inherit`,
    marginLeft: 0,
  }

  const { title } = data.site.siteMetadata

  const defaultAccentColor = data.site.siteMetadata.accentColor;

  const navItemList: NavItem[] = [
    {
      name: "resume",
      path: "/resume",
    },
    {
      name: "projects",
      path: "/projects",
    },
    {
      name: "contact",
      path: "/contact",
    },
  ]

  const navItemElementList = navItemList.map((item: NavItem, i: number) => {
    let elementWiseStyle: any = navItemStyle

    if (i !== navItemList.length - 1) {
      elementWiseStyle = { ...elementWiseStyle, paddingRight: "20px" }
    }

    return (
      <li style={elementWiseStyle}>
        <Link style={navItemLinkStyle} to={item.path}>
          {item.name}
        </Link>
      </li>
    )
  })

  return (
    <div
      className={"nav-flex-container"}
      style={{
        paddingBottom: rhythm(0.5),
        alignItems: "center",
      }}
    >
      <h1
        style={{
          ...scale(0.5),
          color: accentColor ? accentColor : defaultAccentColor,
          marginTop: 0,
          height: "min-content",
          flexShrink: 0,
        }}
        className={"site-title"}
      >
        <Link
          style={{
            textDecoration: `none`,
            color: `inherit`,
          }}
          to={`/`}
        >
          {title}
        </Link>
      </h1>
      <ul
        style={{
          flexGrow: 1,
          flexDirection: "row",
          listStyleType: "none",
          textAlign: "right",
          marginBottom: 0,
          marginLeft: 0,
          height: "min-content",
        }}
        children={navItemElementList}
      />
    </div>
  )
}

export default Nav
