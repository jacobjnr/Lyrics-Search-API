const express = require('express');
const axios = require('axios');
const qs = require('qs');
const querystring = require('querystring');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
//require('dotenv').config({ path: './Spotify.env'});


const app = express();

app.use(express.static('./userinterface'));
app.use(bodyParser.json());

console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('CLIENT_SECRET:', process.env.CLIENT_SECRET);
console.log('RAPID_KEY:', process.env.RAPID_KEY);

// Replace these with your Spotify app's credentials
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const apiKey = process.env.RAPID_KEY;
const redirectUri = 'https://lyrics-search-931f11867680.herokuapp.com/callback'; // Ensure this matches the redirect URI in your Spotify app settings



// Function to refresh the access token using the refresh token


// Function to fetch song lyric


app.get('/login', (req, res) => {
    res.redirect(`https://accounts.spotify.com/authorize?${querystring.stringify({
        response_type: 'code',
        client_id: clientId,
        scope: 'user-read-private user-read-email',
        redirect_uri: redirectUri,
    })}`);
});

// Route for handling callback from Spotify after user authorizes
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    if (!code) {
        res.send('Authorization code not found');
        return;
    }

    try {
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: qs.stringify({
                code: code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
        });

        const accessToken = response.data.access_token;
        // Use the access token to access Spotify API or redirect as needed
        res.redirect(`https://lyrics-search-931f11867680.herokuapp.com?access_token=${accessToken}`);
    } catch (error) {
        console.error('Error during the token exchange', error.response.data);
        res.send('Error during the token exchange');
    }
});
app.post('/fetchlyrics', async (req, res) => {
    try {
        // Extract song name and artist name from the request body
        const { artistName, songName } = req.body;

        // Make sure artistName and songName are provided
        if (!artistName || !songName) {
            return res.status(400).json({ error: 'Missing artistName or songName in request body' });
        }

        // Musixmatch API key (replace 'YOUR_API_KEY' with your actual API key)
        

        // Search for track using artistName and songName
        const searchUrl = `https://api.musixmatch.com/ws/1.1/track.search?q_artist=${encodeURIComponent(artistName)}&q_track=${encodeURIComponent(songName)}&apikey=${apiKey}`;
        const searchResponse = await axios.get(searchUrl);


        const searchData = searchResponse.data;

        // Extract track ID from search results
        const trackId = searchData.message.body.track_list[0].track.track_id;

        // Retrieve lyrics using track ID
        const lyricsUrl = `https://api.musixmatch.com/ws/1.1/track.lyrics.get?track_id=${trackId}&apikey=${apiKey}`;
        const lyricsResponse = await axios.get(lyricsUrl);
        const lyricsData = lyricsResponse.data;

        if (lyricsData.message.header.status_code !== 200 || !lyricsData.message.body.lyrics) {
            return res.status(404).json({ error: 'Lyrics not found' });
        }

        // Extract lyrics from response
        const lyrics = lyricsData.message.body.lyrics.lyrics_body;
        


        // Send lyrics back to client
        res.json({ lyrics });
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        res.status(500).json({ error: 'Failed to fetch lyrics' });
    }
});




app.listen(PORT, () => {
    console.log(`Server listening at ${PORT}`);
});





//https://accounts.spotify.com/authorize?client_id=ac22634baebf4fe68e5675660e8d9153&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback&scope=user-read-private%20user-read-email&state=xyzABC123
