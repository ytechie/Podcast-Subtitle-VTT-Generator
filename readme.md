# Podcast Subtitle (VTT) Generator

A simple tool to generate subtitles (closed captions) for an audio or video file.

Machines are generally terrible at generating subtitles, especially with audio from podcasts since there is a lot of domain specific lingo. Humans are MUCH better in these cases, but humans are also expensive, which may be a non-starter for a free podcast.

## Getting Started

* Clone the repo
* Sign up for a Video Indexer API key: https://videobreakdown.portal.azure-api.net/developer
* Create a settings.js with your API key. It should look like this:
`const vindexerKey = 'YOUR KEY HERE';`
* Run `node index.js`

The script will automatically find the first .WAV file in the current folder, and will process it. It may take a long time, so please be patient. For an hour long podcast, it can take an hour to process in some cases.