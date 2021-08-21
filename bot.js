import dotenv from 'dotenv'
import Twitter from 'twitter'
import fetch from 'node-fetch'

dotenv.config()

const twitterClient = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY ,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET
})

const newCatsThisHour =  async() => {
    const hourAgo = new Date(new Date().getTime()- 1000 * 60 *60).toISOString

    let catWithPhotos = []

    try {
        const tokenRes = await fetch('https://api.petfinder.com/v2/oauth2/token',{
            method: 'POST',
            body: `grant_type=client_credentials&client_id=${process.env.PF_API_KEY}&client_secret=${process.env.PF_SECRET_KEY}`,
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        const {access_token} = await tokenRes.json()
        
        const catRes = await fetch(`https://api.petfinder.com/v2/animals?type=cat&location=74820&time=${hourAgo}`,
        {
            headers:{
                Authorization : `Bearer ${access_token}`,
                'Content-Type' : 'application/x-www-form-urlencoded'
            }
        })

        const {animals} = await catRes.json()
        
        if(animals.length === 0){
            return null
        }

        if (animals.length>0){
            // filter cats with photos
            catWithPhotos = animals.filter(animal => animal.photos.length>0)
            return catWithPhotos
        }

    } catch (error) {
        console.log(error)
    }
}

const shareCat = async()=>{
    const newCats =  await newCatsThisHour()

    if (newCats) {
        twitterClient.post(
            'statuses/update',
            {
                status: `I am looking for a home! ${newCats[0].url}`
            },
            function(error, tweet, response){
                if(!error){
                    console.log(tweet)
                }
                if(error){
                    console.log(error)
                }
            }
        )
    } 
}

shareCat()

setInterval(shareCat, 1000*60*60) //share every hour afterwards