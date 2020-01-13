const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require(`path`)
import { CreateNodeArgs, CreatePagesArgs } from "gatsby"
import {
  Edge,
  MarkdownRemarkConnection,
  MarkdownRemarkNode,
  StrapiPostConnection,
  StrapiPostNode,
} from "./queries"

interface CreatePageQuery {
  allMarkdownRemark: MarkdownRemarkConnection
  allStrapiPost: StrapiPostConnection
}

export const createPages = async ({ graphql, actions }: CreatePagesArgs) => {
  const { createPage } = actions

  const markdownBackedBlogPost = path.resolve(`./src/templates/markdownBackedBlogPost.tsx`)
  // const strapiBackedBlogPost = path.resolve(`./src/templates/strapiBackedBlogPost.tsx`)
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

     # allStrapiPost {
     #   edges {
     #     node {
     #       body
     #       slug
     #       author {
     #         username
     #       }
     #       created_at
     #     }
     #   }
     # }
    }
  `)

  if (result.errors) {
    throw result.errors
  }

  const posts: Array<Edge<MarkdownRemarkNode>> =
    result.data.allMarkdownRemark.edges
  
  posts.forEach((post: Edge<MarkdownRemarkNode>, index: number) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node
  
    createPage({
      path: post.node.fields.slug,
      component: markdownBackedBlogPost,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
      },
    })
  })

  // const posts: Array<Edge<StrapiPostNode>> = result.data.allStrapiPost.edges

  // posts.forEach((post: Edge<StrapiPostNode>, index: number) => {
  //   const previous = index === posts.length - 1 ? null : posts[index + 1].node
  //   const next = index === 0 ? null : posts[index - 1].node

  //   createPage({
  //     path: post.node.slug,
  //     component: strapiBackedBlogPost,
  //     context: {
  //       slug: post.node.slug,
  //       previous,
  //       next,
  //     },
  //   })
  // })
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
