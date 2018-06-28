module.exports = app => {
  app.on("push", async context => {
    const {owner, repo} = context.repo()
    const {head_commit: {id: sha}} = context.payload

    app.log("Hello push", owner, repo, sha)

    // Create a commit comment
    // POST /repos/:owner/:repo/commits/:sha/comments
    let url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/comments`
    let result = await context.github.request({
      method: 'POST',
      url: url,
      body: ':wave:'
    })

    app.log("result %j", result)
  })
}
