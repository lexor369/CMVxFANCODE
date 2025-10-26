/*
* This is your new proxy server.
* It will be automatically available at /proxy on your website.
* It takes the 'url' parameter, fetches it while pretending to be fancode.com,
* and then sends the video stream back to your player.
*/
export async function onRequest(context) {
  // Get the stream URL from the query string (e.g., /proxy?url=...)
  const url = new URL(context.request.url);
  const streamUrl = url.searchParams.get('url');

  if (!streamUrl) {
    return new Response('Error: No stream URL parameter provided', { status: 400 });
  }

  try {
    // --- THIS IS THE CRITICAL PART ---
    // We fetch the stream, but we set a fake 'Referer' header.
    // This makes the stream server think the request is coming from fancode.com
    const streamRequest = new Request(streamUrl, {
      headers: {
        'Referer': 'https://www.fancode.com/',
        'Origin': 'https://www.fancode.com',
        'User-Agent': context.request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
      }
    });

    // Fetch the actual video stream
    const response = await fetch(streamRequest);

    // Send the video stream back to the JW Player
    // We create a new response to handle headers correctly
    const newResponse = new Response(response.body, response);
    
    // Set CORS headers to allow your player to access the proxy
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    
    return newResponse;

  } catch (e) {
    return new Response(`Error fetching stream: ${e.message}`, { status: 500 });
  }
}

