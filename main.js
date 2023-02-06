const axios = require('axios');
const fs = require('fs');
const lighthouse = require('@lighthouse-web3/sdk');
const yargs = require('yargs');

require("dotenv").config();

const SERVER = 'fosstodon.org';
const STORE = './store'
const LIMIT = 40;
const argv = yargs
  .command('init', 'Initialize the oldest and newest post ID files', {}, init)
  .command('older', 'Fetch and save 40 posts older than the current oldest post', {}, fetchOlderPosts)
  .command('recent', 'Fetch and save 40 most recent posts at a time', {}, fetchRecentPosts)
  .help()
  .argv;


async function init() {
  try {
    // let maxId = BigInt(fs.readFileSync('oldest', 'utf-8'));
    // maxId -= 1n;
    // console.log(maxId)
    const response = await axios.get(`https://${SERVER}/api/v1/timelines/public`, {
      params: {
        limit: LIMIT,
        // max_id: maxId,
        local: 'true'
      }
    });
    const posts = response.data;
    let oldestId = posts[posts.length - 1].id;
    let newestId = posts[0].id;
    fs.writeFileSync('oldest', oldestId);
    fs.writeFileSync('newest', newestId);
    // posts.forEach(post => console.log(post.id, post.created_at));
    storePosts(posts);
    // const firstPostCreatedAt = new Date(posts[0].created_at).toISOString();
    // const lastPostCreatedAt = new Date(posts[posts.length - 1].created_at).toISOString();
    // const fileName = STORE + `/${SERVER}-${firstPostCreatedAt}-${lastPostCreatedAt}.json`;
    // fs.writeFileSync(fileName, JSON.stringify(posts), 'utf-8');
  } catch (error) {
    console.error(error);
  }
}

async function fetchRecentPosts() {
  try {
    // let maxId = BigInt(fs.readFileSync('oldest', 'utf-8'));
    // maxId -= 1n;
    // console.log(maxId)
    let min_id = findMostRecentId();
    let max_id = ''; // HACK
    // let overwrittenNewest = false;
    // gets 
    while (1) {
      const response = await axios.get(`https://${SERVER}/api/v1/timelines/public`, {
        params: {
          limit: LIMIT,
          max_id,
          min_id,
          local: 'true'
        }
      })
      console.log(`Fetching URL: ${response.request.res.responseUrl}`);
      // console.log(response)
      const posts = response.data;
      if (posts.length == 0) {
        break;
      }
      let oldestId = BigInt(posts[posts.length - 1].id);
      // let newestId = BigInt(posts[0].id);
      max_id = oldestId;
      // fs.writeFileSync('oldest', oldestId.toString());
      // if (!overwrittenNewest) {
      //   fs.writeFileSync('newest', newestId.toString());
      //   overwrittenNewest = true;
      // }

      storePosts(posts);

      // // posts.forEach(post => console.log(post.id, post.created_at));
      // const firstPostCreatedAt = new Date(posts[0].created_at).toISOString();
      // const lastPostCreatedAt = new Date(posts[posts.length - 1].created_at).toISOString();
      // const fileName = `${SERVER}-${firstPostCreatedAt}-${lastPostCreatedAt}.json`;
      // fs.writeFileSync(fileName, JSON.stringify(posts), 'utf-8');
    }
  } catch (error) {
    console.error(error);
  }
}

async function fetchOlderPosts() {
  try {
    const maxId = findOldestId() - 1n;
    const response = await axios.get(`https://${SERVER}/api/v1/timelines/public`, {
      params: {
        limit: LIMIT,
        max_id: maxId,
        local: 'true'
      }
    });
    console.log(`Fetching URL: ${response.request.res.responseUrl}`);
    const posts = response.data;
    storePosts(posts);
    // const firstPostCreatedAt = new Date(posts[0].created_at).toISOString();
    // const lastPostCreatedAt = new Date(posts[posts.length - 1].created_at).toISOString();
    // const fileName = `${SERVER}-${firstPostCreatedAt}-${lastPostCreatedAt}.json`;
    // fs.writeFileSync(fileName, JSON.stringify(posts), 'utf-8');
    // console.log(`Saved posts to ${fileName}`);
    // upload(fileName);
  } catch (error) {
    console.error(error);
  }
}

async function storePosts(posts) {
  const firstPostCreatedAt = new Date(posts[0].created_at).toISOString();
  const lastPostCreatedAt = new Date(posts[posts.length - 1].created_at).toISOString();
  const fileName = `${STORE}/${SERVER}-${firstPostCreatedAt}-${lastPostCreatedAt}.json`;
  fs.writeFileSync(fileName, JSON.stringify(posts), 'utf-8');
  console.log(`Saved posts to ${fileName}`);
  upload(fileName);
}

async function upload(fileName) {
  //generate from https://files.lighthouse.storage/ or cli (lighthouse-web3 api-key --new)
  const apiKey = process.env.API_KEY; 
  console.log(fileName, apiKey);
  const response = await lighthouse.upload('./' + fileName, apiKey);
  // console.log(response);
  console.log("Visit at: https://gateway.lighthouse.storage/ipfs/" + response.data.Hash);
  fs.writeFileSync(fileName.replace('json', 'cid'), response.data.Hash, 'utf-8');
}

function findMostRecentId() {
  const files = fs.readdirSync(STORE).filter(file => file.startsWith(SERVER) && file.endsWith('.json'));
  let mostRecentId = 0n;
  for (const file of files) {
    const contents = JSON.parse(fs.readFileSync(STORE + '/' + file, 'utf-8'));
    for (const post of contents) {
      const id = BigInt(post.id);
      if (id > mostRecentId) {
        mostRecentId = id;
      }
    }
  }
  return mostRecentId;
}

function findOldestId() {
  const files = fs.readdirSync(STORE).filter(file => file.startsWith(SERVER) && file.endsWith('.json'));
  let oldestId = 109811390171541037n; //XXX choose sane BigInt(Number.MAX_SAFE_INTEGER);
  for (const file of files) {
    const contents = JSON.parse(fs.readFileSync(STORE + '/' + file, 'utf-8'));
    for (const post of contents) {
      const id = BigInt(post.id);
      if (id < oldestId) {
        oldestId = id;
      }
    }
  }
  return oldestId;
}
