# storadon
### A protocol for preserving Mastodon communities for eternity.

# introduction
Much of our Internet existence is encapsulated in our collective posts on social media, especially between members of a community who have a long history of interacting with each other on centrally controlled servers like, Twitter or Mastodon. One problem with any centrally managed server is that the server is a single point of failure, which leads to all the content stored on it to be lost forever or delete it on purpose. This could be years of messages and threads for thousands of community members.

The problem with Twitter is that the company is hostile to third-party access of their data via API, which makes it difficult or impossible to archive community history even if you could solve the problem of defining the communities members as a subset of the billions of Twitter users. This is why Mastodon is an ideal server implementation for archiving communities' history. Our protocol takes advantage of the Mastodon API to create a standard archive format that can be updated and then uses Lighthouse to store the data to be accessed by anyone at any time in the future, regardless of the status of the original Mastodon server which may go down temporarily or permanently as happens all the time. 

# setup 
Clone this repo, and run:
```
$ npm i
```

Create an account on Lighthouse and generate an API key and copy it. We test with the Polygon Mumbai testnet. For the time being, you don't need to top up any funds as you will receive 1 gigabyte of storage with your account.
```
$ export API_KEY=...
$ source lhapikey.sh

$ rm store/*

$ node main.js init

$ node main.js older
```
This will fetch the most recent tweets, and then the ones slightly older, and save them all to files in the store, upload them to IPFS, using Lighthouse, and save the resulting CID. Lighthouse will take care of creating a deal on Filecoin, and ensure it is stored forever.

```
curl https://gateway.lighthouse.storage/ipfs/$(cat $(ls store/*.cid | tail -1)) | jq '.[]|.content'
```

