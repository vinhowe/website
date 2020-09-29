import * as React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"

// import { SiteNode } from "../queries"

class ContactMe extends React.Component<ContactMeProps, {}> {
  render() {
    return (
      <Layout location={this.props.location} title="Contact">
        <SEO title="Contact"/>
        <h1>Contact</h1>
        <img src={"images/contactaddr.png"} alt="My email address"/>
      </Layout>
    )
  }
}

interface ContactMeProps {
  location: Location
}

export default ContactMe

