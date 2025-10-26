/*
* This is your proxy server.
* Tries to fetch streams with specific headers to bypass restrictions.
*/
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const streamUrl = url.searchParams.get('url');

  if (!streamUrl) {
    return new Response('Error: No stream URL parameter provided', { status: 400 });
  }

  try {
    // --- Using a standard Chrome User-Agent ---
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

    const streamRequest = new Request(streamUrl, {
      headers: {
        'Referer': 'https://www.fancode.com/',
        'Origin': 'https://www.fancode.com',
        'User-Agent': userAgent // Use the updated User-Agent
      },
       // Add redirect handling - sometimes needed
      redirect: 'follow' 
    });

    console.log(`Proxy attempting to fetch: ${streamUrl} with User-Agent: ${userAgent}`);

    // Fetch the actual video stream
    const response = await fetch(streamRequest);

    console.log(`Proxy received response status: ${response.status} for ${streamUrl}`);

    // If FanCode still blocks us (403), return that error clearly
    if (response.status === 403) {
        console.error(`Proxy fetch failed with 403 Forbidden for ${streamUrl}`);
        return new Response('Error: Upstream server denied access (403 Forbidden)', { status: 403 });
    }
     // Handle other potential errors from FanCode server
    if (!response.ok) {
        console.error(`Proxy fetch failed with status ${response.status} for ${streamUrl}`);
        return new Response(`Error: Upstream server responded with status ${response.status}`, { status: response.status });
    }

    // Send the video stream back to the Player
    const newResponse = new Response(response.body, response);
    
    // Set CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    // Copy content-type header from original response
    if (response.headers.has('content-type')) {
        newResponse.headers.set('content-type', response.headers.get('content-type'));
    }
    
    return newResponse;

  } catch (e) {
    console.error(`Proxy fetch encountered an exception: ${e.message}`);
    return new Response(`Error fetching stream via proxy: ${e.message}`, { status: 500 });
  }
}

