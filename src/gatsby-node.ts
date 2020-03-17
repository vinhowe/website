const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require(`path`)
import {
  CreateNodeArgs,
  CreatePagesArgs,
  CreateWebpackConfigArgs,
} from "gatsby"
import { Edge, MDXConnection, MdxNode } from "./queries"

interface CreatePageQuery {
  allMdx: MDXConnection
}

export const onCreateWebpackConfig = ({
                                        stage,
                                        rules,
                                        loaders,
                                        plugins,
                                        actions,
                                      }: CreateWebpackConfigArgs) => {
  actions.setWebpackConfig({
    module: {
      rules: [
        {
          test: /\.wasm$/i,
          type: "javascript/auto",
          use: [
            {
              loader: 'file-loader',
            },
          ],
        },
        {
          test: /\.js$/,
          loader: require.resolve('@open-wc/webpack-import-meta-loader'),
        },
        // {
        //   test: /\.wasm$/,
        //   type: "webassembly/experimental",
        //   // include: path.resolve(__dirname, 'src'),
        //   // use: [{ loader: require.resolve('wasm-loader'), options: {} }]
        // },
        // {
        //   test: /\.wasm$/,
        //   // loaders: ["base64-loader"],
        //   type: "javascript/auto",
        // },
      ],
      // noParse: /\.wasm$/
    },
    // experiments: {
    //   asyncWebAssembly: true,
    //   importAwait: true,
    // },
    plugins: [
      // new WasmPackPlugin({
      //   crateDirectory: path.resolve(
      //     __dirname,
      //     "interactive",
      //     "the-show-stops-wasm",
      //     "the-show-stops-wasm-wasm",
      //   ),
      // }),
      plugins.define({
        __DEVELOPMENT__: stage === `develop` || stage === `develop-html`,
      }),
    ],
  })
}

export const createPages = async ({ graphql, actions }: CreatePagesArgs) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blogPost.tsx`)
  const result = await graphql<CreatePageQuery, any>(`
    {
      allMdx(sort: { fields: [frontmatter___date], order: DESC }, limit: 1000) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              title
              layoutPath
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
  const posts: Array<Edge<MdxNode>> = result.data.allMdx.edges

  posts.forEach((post: Edge<MdxNode>, index: number) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node

    const layout = post.node.frontmatter.layoutPath
      ? path.resolve(post.node.frontmatter.layoutPath)
      : blogPost
    createPage({
      path: post.node.fields.slug,
      component: layout,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
      },
    })
  })
}

export const onCreateNode = ({ node, actions, getNode }: CreateNodeArgs) => {
  const { createNodeField } = actions

  if (node.internal.type === `Mdx`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
