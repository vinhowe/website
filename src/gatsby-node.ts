const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require(`path`)
import { CreateNodeArgs, CreatePagesArgs } from "gatsby"
import { Edge, MarkdownRemarkConnection, MarkdownRemarkNode } from "./queries"

interface CreatePageQuery {
  allMarkdownRemark: MarkdownRemarkConnection
}

export const createPages = async ({ graphql, actions }: CreatePagesArgs) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blogPost.tsx`)
  const result = await graphql<CreatePageQuery, any>(`
      {
          allMarkdownRemark(
              sort: { fields: [frontmatter___date], order: DESC }
              limit: 1000
          ) {
              edges {
                  node {
                      fields {
                          slug
                      }
                      frontmatter {
                          title
                      }
                  }
              }
          }
      }
  `)

  if (result.errors) {
    throw result.errors
  }

  // Create blog posts pages.
  const posts: Array<Edge<MarkdownRemarkNode>> = result.data.allMarkdownRemark.edges

  posts.forEach((post: Edge<MarkdownRemarkNode>, index: number) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node

    createPage({
      path: post.node.fields.slug,
      component: blogPost,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
      },
    })
  })
}

exports.onCreateNode = ({ node, actions, getNode }: CreateNodeArgs) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}