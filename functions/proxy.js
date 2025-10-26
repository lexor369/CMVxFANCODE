/*
* This is your proxy server.
* It will be available at /proxy on your website.
*/
export async function onRequest(context) {
  // Get the stream URL from the query string (e.g., /proxy?url=...)
  const url = new URL(context.request.url);
  const streamUrl = url.searchParams.get('url');

  if (!streamUrl) {
    return new Response('Error: No stream URL parameter provided', { status: 400 });
  }

  try {
    // We fetch the stream, but we set a fake 'Referer' header.
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
    const newResponse = new Response(response.body, response);
    
    // Set CORS headers to allow your player to access the proxy
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    
    return newResponse;

  } catch (e) {
    return new Response(`Error fetching stream: ${e.message}`, { status: 500 });
  }
}


