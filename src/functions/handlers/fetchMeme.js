const fetch = require("node-fetch");
const subreddits = require("./subreddits");

const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
const USER_AGENT = process.env.REDDIT_USER_AGENT;

// Get token
async function getToken() {
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT
    },
    body: "grant_type=client_credentials"
  });

  const data = await res.json();
  return data.access_token;
}

const valid = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

function isValid(url) {
  if (!url) return false;
  url = url.split("?")[0].toLowerCase();
  return valid.some(e => url.endsWith(e));
}

async function fetchMeme() {
  const token = await getToken();
  if (!token) return null;

  const sub = subreddits[Math.floor(Math.random() * subreddits.length)];

  const res = await fetch(
    `https://oauth.reddit.com/r/${sub}/hot?limit=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": USER_AGENT
      }
    }
  );

  const json = await res.json();

  const posts = json.data.children
    .map(p => p.data)
    .filter(
      p =>
        !p.over_18 &&
        (p.post_hint === "image" || p.url?.endsWith(".gif")) &&
        isValid(p.url)
    );

  if (!posts.length) return null;

  const post = posts[Math.floor(Math.random() * posts.length)];

  return {
    url: post.url,
    subreddit: post.subreddit
  };
}

module.exports = fetchMeme;
