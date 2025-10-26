/*
* Proxy server for HLS streams.
* Includes stricter Content-Type checking.
*/
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const streamUrl = url.searchParams.get('url');

  if (!streamUrl) {
    return new Response('Error: No stream URL parameter provided', { status: 400 });
  }

  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

    const streamRequest = new Request(streamUrl, {
      headers: {
        'Referer': 'https://www.fancode.com/',
        'Origin': 'https://www.fancode.com',
        'User-Agent': userAgent
      },
      redirect: 'follow' 
    });

    console.log(`Proxy attempting to fetch: ${streamUrl}`);
    const response = await fetch(streamRequest);
    console.log(`Proxy received status: ${response.status} for ${streamUrl}`);

    if (!response.ok) {
        // If status is 4xx or 5xx, return the error directly
        console.error(`Proxy fetch failed with status ${response.status} for ${streamUrl}`);
        // Read body for potential error message from upstream
        const errorBody = await response.text().catch(() => `Upstream error status ${response.status}`); 
        return new Response(`Error: Upstream server responded with status ${response.status}. Body: ${errorBody.substring(0, 200)}`, { status: response.status });
    }

    // --- Strict Content-Type Check ---
    const contentType = response.headers.get('content-type') || '';
    console.log(`Received Content-Type: ${contentType}`);

    // Check if it's a valid HLS content type
    const isValidHlsType = contentType.includes('application/vnd.apple.mpegurl') || 
                           contentType.includes('audio/mpegurl') || 
                           contentType.includes('application/x-mpegurl') ||
                           contentType.includes('video/mp2t'); // Added for .ts segments

    if (!isValidHlsType && response.status === 200) {
        // If status is 200 but content type is wrong (e.g., text/html), it's likely an error/login page.
        const responseBody = await response.text().catch(() => ''); // Try to read the body
        console.error(`Proxy received status 200 but invalid Content-Type '${contentType}' for ${streamUrl}. Body peek: ${responseBody.substring(0, 200)}`);
        // Return a specific error code that HLS.js might understand as fatal
        return new Response(`Error: Received invalid content type '${contentType}' from upstream`, { status: 415 }); // 415 Unsupported Media Type
    }
    // --- End of Check ---


    // If OK and valid content type, send the stream back
    const newResponse = new Response(response.body, response); // Re-create response to modify headers
    
    // Set CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    
    // Ensure the correct Content-Type is passed back
    if (contentType) {
       newResponse.headers.set('content-type', contentType);
    }
    
    return newResponse;

  } catch (e) {
    console.error(`Proxy fetch encountered an exception: ${e.message}`);
    return new Response(`Error fetching stream via proxy: ${e.message}`, { status: 500 });
  }
}

