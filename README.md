# futureporn-qa

Quality Assurance

home of Futureporn.net Discord Futurebot

## Feature

* [x] Implement webhook
* [x] When Strapi record is updated, pin all CIDs
* [ ] Be idempotent https://github.com/insanity54/futureporn/issues/160
* [x] Post a message in Discord
* [ ] Don't post empty message https://github.com/insanity54/futureporn/issues/159


## dev notes


```js
{
  event: 'entry.update',
  createdAt: '2023-05-08T09:58:12.118Z',
  model: 'vod',
  uid: 'api::vod.vod',
  entry: {
    id: 29,
    videoSrcHash: null,
    video720Hash: null,
    video480Hash: null,
    video360Hash: null,
    video240Hash: null,
    thinHash: null,
    thiccHash: null,
    announceTitle: null,
    announceUrl: null,
    note: 'asdfsdkljkksdsdd',
    date: '2024-04-22T08:00:00.000Z',
    spoilers: null,
    title: null,
    createdAt: '2023-05-08T09:48:48.052Z',
    updatedAt: '2023-05-08T09:58:12.102Z',
    publishedAt: '2023-05-08T09:51:39.409Z',
    tags: { count: 0 },
    uploader: { count: 1 },
    backup: { count: 1 },
    muxAsset: { count: 1 }
  }
}
```


## @todo

delete the following IPFS (test) CIDs from the cluster

* bafybeiatnb3t2n2njxhbyyaebsuoutsi3wcx6xxzlkjjdarsqp3yitfxae
