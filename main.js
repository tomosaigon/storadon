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
