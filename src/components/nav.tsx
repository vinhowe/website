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

const Nav = () => {
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
    marginBottom: 0
  }

  const navItemLinkStyle = {
    boxShadow: `none`,
    color: `inherit`,
    marginLeft: 0,
  }

  const { title, accentColor } = data.site.siteMetadata

  const navItemList: NavItem[] = [
    {
      name: "resume",
      path: "/resume",
    },
    // {
    //   name: "about",
    //   path: "/about",
    // },
  ]

  const navItemElementList = navItemList.map((item: NavItem, i: number) => {
    let elementWiseStyle: any = navItemStyle;

    if (i !== navItemList.length - 1) {
      elementWiseStyle = {...elementWiseStyle, paddingRight: "20px"}
    }

    return (<li style={elementWiseStyle}>
      <Link
        style={navItemLinkStyle}
        to={item.path}
      >{item.name}</Link>
    </li>)
  })

  return (
    <div
      className={"nav-flex-container"}
      style={{
        paddingBottom: rhythm(1),
        alignItems: "center"
      }}
    >
      <h1
        style={{
          ...scale(0.5),
          color: accentColor,
          marginTop: 0,
          height: "min-content",
          flexShrink: 0,
        }}
        className={"site-title"}
      >
        <Link
          style={{
            boxShadow: `none`,
            color: `inherit`,
          }}
          to={`/`}
        >
          {title}
        </Link>
      </h1>
      <ul style={{
        flexGrow: 1,
        flexDirection: "row",
        listStyleType: "none",
        textAlign: "right",
        marginBottom: 0,
        marginLeft: 0,
        height: "min-content"
      }} children={navItemElementList}/>
    </div>
  )
}

export default Nav
