// typescript hack here: https://github.com/gatsbyjs/gatsby/issues/1457#issuecomment-381405638

require('source-map-support').install()
require('ts-node').register()

const { createPages, onCreateNode } = require("./src/gatsby-node.ts"); // eslint-disable-line @typescript-eslint/no-var-requires
exports.createPages = createPages;
exports.onCreateNode = onCreateNode;