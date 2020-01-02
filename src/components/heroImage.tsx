/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image, {  } from "gatsby-image"
import { CSSProperties } from "react"

import "./heroImage.css"

const HeroImage = () => {
  const data = useStaticQuery(graphql`
      query HeroImageQuery {
          heroImage: file(absolutePath: { regex: "/hero.jpg/" }) {
              childImageSharp {
                  fluid(maxWidth: 700) {
                      ...GatsbyImageSharpFluid
                  }
              }
          }
      }
  `)

  const imageWrapperStyle: CSSProperties = {
    width: "100%",
    borderRadius: "10px",
    boxShadow: "0px 2px 3px rgba(0,0,0,0.06),0px 5px 15px rgba(0,0,0,0.06),0px 20px 50px rgba(0,0,0,0.06)"
  }

  const imageStyle: CSSProperties = {
    width: "100%",
    marginBottom: "0"
  }

  return (
      <Image
        // style={imageWrapperStyle}
        className={"hero-image-wrapper"}
        imgStyle={imageStyle}
        fluid={data.heroImage.childImageSharp.fluid}
      />
  )
}

export default HeroImage