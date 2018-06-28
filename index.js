const strftime = require('strftime')

function commitText(commit) {
  let added = commit.added.map(f => ['A', f])
  let removed = commit.removed.map(f => ['R', f])
  let modified = commit.modified.map(f => ['M', f])

  let changedPaths = [...added, ...removed, ...modified].sort(function (_char, file) {
    return file
  }).map(entry => `${entry[0]} ${entry[1]}`).join('\n    ')

  let commitAuthor = `${commit.author.name} <${commit.author.email}>`
  let text = `Commit: ${commit.id}
      ${commit.url}
  Author: ${commitAuthor}
  Date:   ${commit.timestamp} (${strftime('%a, %d %b %Y', new Date(commit.timestamp))})`

  if (changedPaths.length > 0) {
    text += `

  Changed paths:
    ${changedPaths}`
  }

  text += `

  Log Message:
  -----------
  ${commit.message}

  `
  return text
}

function commitSummary(payload) {
  let nameWithOwner = payload.repository.full_name
  let firstCommitSha = payload.commits[0].id.slice(0, 8)
  let firstCommitTitle = payload.commits[0].message
  return `[${nameWithOwner}] ${firstCommitSha}: ${firstCommitTitle}`
}

function commentBody(payload) {
  const summary = commitSummary(payload)
  let body = `**${summary}**

  Branch: ${payload.ref}
  Home:   ${payload.repository.html_url}
  `

  payload.commits.forEach((commit) => {
    body += commitText(commit)
  })

  if (payload.commits[0].id !== payload.commits[payload.length - 1]) {
    body += `Compare: ${payload.compare}\n`
  }

  // Strip leading whitespaces from body
  body = body.replace(/^ {2}/gm, '')

  return body
}

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
      body: commentBody(context.payload)
    })

    app.log("result %j", result)
  })
}
