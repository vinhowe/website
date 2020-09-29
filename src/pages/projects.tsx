import * as React from "react"
import { graphql } from "gatsby"

import SEO from "../components/seo"
import Layout from "../components/layout"
import ReactMarkdown from "react-markdown"

class Projects extends React.Component<ProjectsProps, {}> {
  constructor(props: ProjectsProps) {
    super(props)
    this.state = {
      projectsVisibilityState: "selected",
    }
  }

  render() {
    const { data } = this.props

    const projects = data.allTimelineYaml.nodes

    return (
      <Layout location={this.props.location} title="Projects">
        <SEO title={"projects"} />
        <h1>Projects</h1>
        <p>
          This is a list of a bunch of things I've tried over the years&mdash;I use
          "project" liberally. The ordering here is probably wrong.
        </p>
        <ul>
          {projects.map(({ description, date }, index) => {
            const showDate =
              date && !(index != 0 && projects[index - 1].date.startsWith(date))
            return (
              <li>
                <span>
                  <ReactMarkdown>
                    {showDate ? `__${date}:__ ${description}` : description}
                  </ReactMarkdown>
                </span>
              </li>
            )
          })}
        </ul>
      </Layout>
    )
  }
}

export default Projects

interface ProjectsProps {
  data: {
    allTimelineYaml: {
      nodes: {
        description: string
        date?: string
      }[]
    }
  }
  location: Location
}

export const pageQuery = graphql`
  query {
    allTimelineYaml {
      nodes {
        description
        date
      }
    }
  }
`
