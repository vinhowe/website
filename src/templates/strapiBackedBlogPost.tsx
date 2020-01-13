// import * as React from "react"
// import { Link, graphql } from "gatsby"

// import Layout from "../components/layout"
// import SEO from "../components/seo"
// import { rhythm, scale } from "../utils/typography"
// import { StrapiPostNode } from "../queries"
// import ReactMarkdown from "react-markdown"


// class MarkdownBackedBlogPostTemplate extends React.Component<StrapiBlogPostTemplateProps, {}> {
//   render() {
//     const post = this.props.data.strapiPost
//     const siteTitle = this.props.data.site.siteMetadata.title
//     const { previous, next } = this.props.pageContext

//     return (
//       <Layout location={this.props.location} title={siteTitle}>
//         <SEO
//           title={post.title}
//           description={post.description}
//         />
//         <article>
//           <header>
//             <h2
//               style={{
//                 marginTop: rhythm(1),
//                 marginBottom: 0,
//               }}
//             >
//               {post.title}
//             </h2>
//             <p
//               style={{
//                 ...scale(-1 / 5),
//                 display: `block`,
//                 marginBottom: rhythm(1),
//               }}
//             >
//               {post.publishedAt}
//             </p>
//           </header>
//           <ReactMarkdown source={post.body} />

//           <footer>
//             <p>vin</p>
//           </footer>
//         </article>

//         <nav>
//           <ul
//             style={{
//               display: `flex`,
//               flexWrap: `wrap`,
//               justifyContent: `space-between`,
//               listStyle: `none`,
//               padding: 0,
//             }}
//           >
//             <li>
//               {previous && (
//                 <Link to={previous.fields.slug} rel="prev">
//                   ← {previous.frontmatter.title}
//                 </Link>
//               )}
//             </li>
//             <li>
//               {next && (
//                 <Link to={next.fields.slug} rel="next">
//                   {next.frontmatter.title} →
//                 </Link>
//               )}
//             </li>
//           </ul>
//         </nav>
//       </Layout>
//     )
//   }
// }

// interface Frontmatter {
//   title: string
//   date: string
//   description: string
// }

// interface MarkdownRemark {
//   id: string
//   excerpt: string
//   html: string
//   frontmatter: Frontmatter
// }

// interface PageSiteMetadata {
//   title: string
// }

// interface PageSite {
//   siteMetadata: PageSiteMetadata
// }

// interface StrapiBlogPostData {
//   strapiPost: StrapiPostNode
//   site: PageSite
// }

// interface StrapiBlogPostTemplateProps {
//   data: StrapiBlogPostData
//   location: Location
//   pageContext: any
// }

// export default MarkdownBackedBlogPostTemplate

// export const pageQuery = graphql`
//     query StrapiBlogPostBySlug($slug: String!) {
//         site {
//             siteMetadata {
//                 title
//             }
//         }
//         strapiPost(slug: {eq: $slug}) {
//             title
//             description
//             slug
//             author {
//                 username
//             }
//             publishedAt
//             body
//         }
//     }
// `
