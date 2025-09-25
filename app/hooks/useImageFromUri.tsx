'use client'

import { useState, useEffect } from 'react'

// Cache for fetched images to avoid repeated requests
const imageCache = new Map<string, string | null>()

export const useImageFromUri = (uri: string | undefined, fallbackImage?: string) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(fallbackImage)
  const [loading, setLoading] = useState(false)
  const [socialLinks, setSocialLinks] = useState<{twitter?: string, website?: string}>({})

  useEffect(() => {
    if (!uri) {
      setImageUrl(fallbackImage)
      return
    }

    // If URI is already an image URL, use it directly
    if (uri.includes('http') && (uri.includes('.png') || uri.includes('.jpg') || uri.includes('.jpeg') || uri.includes('.webp') || uri.includes('.gif'))) {
      setImageUrl(uri)
      return
    }

    // Check cache first
    if (imageCache.has(uri)) {
      const cached = imageCache.get(uri)
      setImageUrl(cached || fallbackImage)
      return
    }

    // Fetch metadata from URI
    const fetchImageFromMetadata = async () => {
      setLoading(true)
      
      try {
        // Convert IPFS URLs to HTTP gateway
        let fetchUrl = uri
        if (uri.startsWith('ipfs://')) {
          fetchUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
        }

        if (fetchUrl.includes('http')) {
          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          })

          if (response.ok) {
            const metadata = await response.json()
            console.log('🔍 Full metadata from URI:', uri, metadata)
            
            // Look for image in multiple possible fields (priority order)
            const imageFields = [
              metadata.image,
              metadata.image_url,
              metadata.logo,
              metadata.icon,
              metadata.avatar,
              metadata.picture,
              metadata.img
            ]
            
            let extractedImageUrl = undefined
            for (const field of imageFields) {
              if (field && typeof field === 'string') {
                extractedImageUrl = field
                break
              }
            }

            // Convert IPFS image URLs to HTTP gateway
            if (extractedImageUrl && extractedImageUrl.startsWith('ipfs://')) {
              extractedImageUrl = extractedImageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
            }

            // Extract social links from metadata - check multiple possible field names
            const extractedSocialLinks: {twitter?: string, website?: string} = {}
            
            // Website/Homepage fields (priority order)
            const websiteFields = [
              metadata.external_url,
              metadata.website, 
              metadata.homepage,
              metadata.home_page,
              metadata.url
            ]
            
            for (const field of websiteFields) {
              if (field && typeof field === 'string' && field.includes('http')) {
                extractedSocialLinks.website = field
                break
              }
            }
            
            // Twitter fields (multiple possible formats)
            const twitterFields = [
              metadata.twitter,
              metadata.twitter_url,
              metadata.social?.twitter,
              metadata.socials?.twitter,
              metadata.links?.twitter
            ]
            
            for (const field of twitterFields) {
              if (field && typeof field === 'string') {
                let twitterUrl = field
                
                // Handle different Twitter URL formats
                if (!twitterUrl.includes('http')) {
                  // Handle @username or username format
                  const username = twitterUrl.replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '')
                  twitterUrl = `https://twitter.com/${username}`
                } else if (twitterUrl.includes('x.com')) {
                  // Convert x.com to twitter.com for consistency
                  twitterUrl = twitterUrl.replace('x.com', 'twitter.com')
                }
                
                extractedSocialLinks.twitter = twitterUrl
                break
              }
            }
            
            console.log('📱 Extracted social links from metadata:', extractedSocialLinks)

            setSocialLinks(extractedSocialLinks)

            if (extractedImageUrl) {
              imageCache.set(uri, extractedImageUrl)
              setImageUrl(extractedImageUrl)
            } else {
              imageCache.set(uri, null)
              setImageUrl(fallbackImage)
            }
          } else {
            imageCache.set(uri, null)
            setImageUrl(fallbackImage)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch image from URI:', error)
        imageCache.set(uri, null)
        setImageUrl(fallbackImage)
      } finally {
        setLoading(false)
      }
    }

    fetchImageFromMetadata()
  }, [uri, fallbackImage])

  return { imageUrl, loading, socialLinks }
}
