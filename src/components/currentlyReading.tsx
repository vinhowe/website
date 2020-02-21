import { graphql, Link, useStaticQuery } from "gatsby"
import { default as React } from "react"
import "./currentlyReading.css"
import { SiteNode } from "../queries"
import { rhythm } from "../utils/typography"

interface CurrentlyReadingQuery {
  currentlyReadingYaml: {
    reading: {
      title: string
      author: string
      thumbnailUrl: string
      amazonUrl: string
      started: string
    }[]
  }
}

const CurrentlyReading = () => {
  const data: CurrentlyReadingQuery = useStaticQuery(graphql`
      query CurrentlyReadingQuery {
          currentlyReadingYaml {
              reading {
                  title
                  author
                  thumbnailUrl
                  amazonUrl
              }
          }
      }
  `)

  // For now we'll just handle the first reading in a list
  const firstBook = data.currentlyReadingYaml.reading[0]

  return (
    <div
      className={"currently-reading-container"}
      style={{
        paddingTop: rhythm(0.25),
      }}
    >
      <p>
        Currently reading
      </p>
      <a href={firstBook.amazonUrl} className={"currently-reading-thumbnail"}>
        <img src={firstBook.thumbnailUrl} alt={firstBook.title}/>
      </a>
      <a href={firstBook.amazonUrl}>
        <i>
          {firstBook.title}
        </i>
      </a>
      <p>
        &nbsp;by {firstBook.author}.
      </p>
    </div>
  )
}

export default CurrentlyReading
