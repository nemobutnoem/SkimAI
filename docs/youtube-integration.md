# YouTube Integration Plan

## Goal

Collect richer YouTube search data for a keyword and derive user-behavior signals without needing write access to YouTube.

## API flow

1. `search.list`
   - purpose: find relevant videos for a keyword
   - key outputs:
     - `videoId`
     - `title`
     - `description`
     - `publishedAt`
     - `channelId`
     - `channelTitle`
     - `thumbnail`

2. `videos.list`
   - purpose: enrich found videos with detailed metrics
   - key outputs:
     - `statistics.viewCount`
     - `statistics.likeCount`
     - `statistics.commentCount`
     - `contentDetails.duration`
     - `snippet.tags`
     - `topicDetails.topicCategories`

3. `channels.list`
   - purpose: enrich source channel quality and reach
   - key outputs:
     - `statistics.subscriberCount`
     - `statistics.videoCount`
     - `statistics.viewCount`
     - `snippet.customUrl`

4. `commentThreads.list`
   - optional next step
   - purpose: read public discussion and sentiment
   - key outputs:
     - top-level comment text
     - reply count
     - like count
     - publishedAt

## Behavior signals we can derive

- `interestScore`
  - based on `viewCount`
- `engagementRate`
  - `(likeCount + commentCount) / max(viewCount, 1)`
- `commentIntensity`
  - `commentCount / max(viewCount, 1)`
- `freshnessScore`
  - newer videos get higher weight
- `creatorReach`
  - based on `subscriberCount`
- `keywordAffinity`
  - based on title, description, tags, and topic categories

## Recommended fields to persist

- search-level
  - `keyword`
  - `videoId`
  - `channelId`
  - `publishedAt`

- content-level
  - `title`
  - `description`
  - `thumbnail`
  - `duration`
  - `tags`
  - `topicCategories`

- performance-level
  - `viewCount`
  - `likeCount`
  - `commentCount`

- channel-level
  - `channelTitle`
  - `customUrl`
  - `subscriberCount`
  - `channelVideoCount`
  - `channelViewCount`

## Current backend mapping

Current provider maps a subset into `NormalizedSourceItem`:

- `title`
- `snippet`
- `url`
- `sourceName`
- `authorName`
- `publishedAt`
- `rawPayload`

The richer YouTube metrics are currently attached into `rawPayload` at provider level and can later be promoted into dedicated DB columns or a separate analytics table.
